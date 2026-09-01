import time
from decimal import Decimal, InvalidOperation

from app.models.policy import ActionType, AgentPolicy
from app.services.llm import parse_policy_with_llm
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ParsePolicyRequest(BaseModel):
    text: str


@router.post("/parse-policy", response_model=AgentPolicy)
def parse_policy(request: ParsePolicyRequest):
    # Temporary parser.
    # The LLM will replace this later.
    return AgentPolicy(
        spending_limit_per_tx=2_000_000_000,
        spending_limit_period=10_000_000_000,
        period_length_ms=3_600_000,
        allowed_actions=[
            ActionType.TRANSFER,
            ActionType.MOCK_SWAP,
        ],
        allowed_targets=[],
        risk_threshold=60,
        expiry_ms=0,
    )


ACTION_MAP = {
    "transfer": ActionType.TRANSFER,
    "mock_swap": ActionType.MOCK_SWAP,
    "stake": ActionType.STAKE,
    "cetus_swap": ActionType.CETUS_SWAP,
}


RISK_THRESHOLD_MAP = {
    "low": 30,
    "medium": 60,
    "high": 85,
}


def sui_to_mist(amount_sui: float) -> int:
    """
    Convert SUI to MIST deterministically.

    1 SUI = 1,000,000,000 MIST.
    """

    try:
        amount = Decimal(str(amount_sui))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Invalid SUI amount") from exc

    if amount < 0:
        raise ValueError("SUI amount cannot be negative")

    mist = amount * Decimal("1000000000")

    if mist != mist.to_integral_value():
        raise ValueError("SUI amount has more precision than MIST supports")

    return int(mist)


def build_agent_policy(llm_policy: dict) -> AgentPolicy:
    """
    Convert the LLM's human-readable policy into the
    exact fields required by AgentPolicy.
    """

    spending_limit_per_tx = sui_to_mist(llm_policy["spending_limit_per_tx_sui"])

    spending_limit_period = sui_to_mist(llm_policy["spending_limit_period_sui"])

    period_length_ms = int(
        Decimal(str(llm_policy["period_length_hours"])) * Decimal("3600000")
    )

    allowed_actions = []

    for action in llm_policy["allowed_actions"]:
        if action not in ACTION_MAP:
            raise ValueError(f"Unsupported action returned by LLM: {action}")

        allowed_actions.append(ACTION_MAP[action])

    risk_stance = llm_policy["risk_stance"]

    if risk_stance not in RISK_THRESHOLD_MAP:
        raise ValueError(f"Unsupported risk stance returned by LLM: {risk_stance}")

    risk_threshold = RISK_THRESHOLD_MAP[risk_stance]

    expiry_hours = llm_policy["expiry_hours"]

    if expiry_hours is None:
        expiry_ms = 0
    else:
        expiry_ms = int(time.time() * 1000 + float(expiry_hours) * 60 * 60 * 1000)

    return AgentPolicy(
        spending_limit_per_tx=spending_limit_per_tx,
        spending_limit_period=spending_limit_period,
        period_length_ms=period_length_ms,
        allowed_actions=allowed_actions,
        allowed_targets=llm_policy["allowed_targets"],
        risk_threshold=risk_threshold,
        expiry_ms=expiry_ms,
    )


@router.post("/parse-policy", response_model=AgentPolicy)
def parse_policy(request: ParsePolicyRequest):
    """
    Convert a natural-language policy into an AgentPolicy.
    """

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Policy text cannot be empty",
        )

    try:
        llm_policy = parse_policy_with_llm(request.text)

        return build_agent_policy(llm_policy)

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM policy parsing failed: {exc}",
        ) from exc


@router.post("/decide")
def decide():
    # Runtime decision logic will be implemented next.
    return {"status": "not implemented"}
