from typing import Annotated

from app.models.agent import AgentSummary
from app.services import sui_events
from fastapi import APIRouter, Query

router = APIRouter()


@router.get("", response_model=list[AgentSummary])
async def list_agents(
    owner: Annotated[str, Query(description="Sui address of the connected wallet")],
):
    created = await sui_events.get_created_caps_for_owner(owner)
    deactivated_ids = await sui_events.get_deactivated_cap_ids()

    return [
        AgentSummary(
            cap_id=cap.cap_id,
            vault_id=cap.vault_id,
            owner=cap.owner,
            operator=cap.operator,
            active=cap.cap_id not in deactivated_ids,
        )
        for cap in created
    ]


@router.post("/parse-policy")
def parse_policy():
    # will take natural-language rules -> structured AgentCap fields
    ...


@router.post("/decide")
def decide():
    # runtime decision: evaluate action against policy
    ...
