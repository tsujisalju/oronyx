from typing import Annotated

from app.models.agent import AgentMetadataCreate, AgentSummary
from app.services import agent_metadata, sui_events
from fastapi import APIRouter, HTTPException, Query

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
            name=agent_metadata.get_agent_name(cap.cap_id),
        )
        for cap in created
    ]


@router.post("/metadata")
def save_metadata(metadata: AgentMetadataCreate):
    name = metadata.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Agent name cannot be empty",
        )

    agent_metadata.save_agent_metadata(
        cap_id=metadata.cap_id,
        owner=metadata.owner,
        name=name,
    )

    return {
        "status": "ok",
        "cap_id": metadata.cap_id,
        "name": name,
    }


@router.post("/parse-policy")
def parse_policy():
    # will take natural-language rules -> structured AgentCap fields
    ...


@router.post("/decide")
def decide():
    # runtime decision: evaluate action against policy
    ...
