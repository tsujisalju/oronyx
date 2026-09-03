"""Epoch-aware validator-set trigger check for the stake decision path.

Polled on a coarse fixed interval (STAKE_TRIGGER_INTERVAL_HOURS in
main.py) rather than a push-based epoch-change signal — pysui's gRPC
surface exposes GetLatestSuiSystemStateSC (current epoch + validator set)
but no dedicated "epoch changed" subscription, so this only proceeds past
the epoch check when the epoch number has actually advanced since last
poll.
"""

import logging

from app.models.policy import ActionType, StakeDecision
from app.services import activity_log, agent_index, executor_client, sui_objects, validator_data
from app.services.llm import decide_agent_action

logger = logging.getLogger(__name__)

# 1 SUI — below this, execute_stake always aborts on-chain (capability.move),
# so there's no point proposing a stake decision at all.
MIN_STAKING_THRESHOLD_MIST = 1_000_000_000

# A validator's commission_rate (basis points, 10000 = 100%) moving by more
# than this is treated as "meaningful" for triggering a decision pass.
COMMISSION_CHANGE_THRESHOLD_BPS = 50


async def check_stake_trigger(force: bool = False) -> None:
    """
    :param force: Skip the epoch-change and commission-move gates and run
        the candidate decision pass regardless (falling back to the full
        current validator set as "changed") — for manual testing via the
        /agents/dev endpoints, not used by the scheduled job.
    """
    state = await validator_data.get_system_state()
    last_state = validator_data.get_last_seen_state()
    validator_data.set_last_seen_state(state)

    if not force:
        if last_state is None:
            return
        if state.epoch == last_state.epoch:
            return

    changed_validators = []
    if last_state is not None:
        last_by_address = {v.address: v for v in last_state.validators}
        changed_validators = [
            v
            for v in state.validators
            if v.address in last_by_address
            and abs(v.commission_rate - last_by_address[v.address].commission_rate)
            >= COMMISSION_CHANGE_THRESHOLD_BPS
        ]

    if not changed_validators:
        if not force:
            return
        changed_validators = state.validators

    candidates = agent_index.get_candidate_agents(ActionType.STAKE)
    for candidate in candidates:
        await _decide_for_candidate(candidate, state, changed_validators)


async def _decide_for_candidate(candidate, state, changed_validators) -> None:
    detail = await sui_objects.get_agent_detail(candidate.cap_id)
    if detail is None or not detail.active:
        return

    if detail.spending_limit_per_tx < MIN_STAKING_THRESHOLD_MIST:
        activity_log.log_decision(
            cap_id=candidate.cap_id,
            action_type=ActionType.STAKE,
            decision="no_action",
            reasoning=(
                f"spending_limit_per_tx ({detail.spending_limit_per_tx} MIST) "
                f"is below the minimum staking threshold "
                f"({MIN_STAKING_THRESHOLD_MIST} MIST); execute_stake would "
                "always abort on-chain."
            ),
        )
        return

    if not detail.allowed_targets:
        activity_log.log_decision(
            cap_id=candidate.cap_id,
            action_type=ActionType.STAKE,
            decision="no_action",
            reasoning="Agent has no allowed targets for stake.",
        )
        return

    recent = activity_log.get_recent_activity(candidate.cap_id, limit=10)

    context = {
        "trigger": {
            "type": "validator_set_change",
            "epoch": state.epoch,
            "changed_validators": [
                {
                    "address": v.address,
                    "name": v.name,
                    "commission_rate": v.commission_rate,
                    "voting_power": v.voting_power,
                }
                for v in changed_validators
            ],
        },
        "agent": {
            "cap_id": detail.cap_id,
            "vault_balance": detail.vault_balance,
            "spending_limit_per_tx": detail.spending_limit_per_tx,
            "spending_limit_period": detail.spending_limit_period,
            "period_spent": detail.period_spent,
            "allowed_targets": detail.allowed_targets,
            "risk_threshold": detail.risk_threshold,
        },
        "recent_activity": [
            {
                "decision": row["decision"],
                "reasoning": row["reasoning"],
                "created_at": row["created_at"],
            }
            for row in recent
        ],
    }

    result = decide_agent_action(context)

    if result["decision"] != "act":
        activity_log.log_decision(
            cap_id=candidate.cap_id,
            action_type=ActionType.STAKE,
            decision="no_action",
            reasoning=result["reasoning"],
        )
        agent_index.mark_decision(candidate.cap_id)
        return

    target = result["target"]
    if target not in detail.allowed_targets:
        activity_log.log_decision(
            cap_id=candidate.cap_id,
            action_type=ActionType.STAKE,
            decision="no_action",
            reasoning=f"LLM proposed disallowed validator {target}, skipped.",
        )
        agent_index.mark_decision(candidate.cap_id)
        return

    decision = StakeDecision(
        type="stake",
        cap_id=detail.cap_id,
        vault_id=detail.vault_id,
        amount_mist=str(result["amount_mist"]),
        risk_score=int(result["risk_score"]),
        validator=target,
    )

    await executor_client.submit_decision(decision)

    activity_log.log_decision(
        cap_id=candidate.cap_id,
        action_type=ActionType.STAKE,
        decision="act",
        reasoning=result["reasoning"],
        target=target,
        amount_mist=decision.amount_mist,
        risk_score=decision.risk_score,
    )
    agent_index.mark_decision(candidate.cap_id)
