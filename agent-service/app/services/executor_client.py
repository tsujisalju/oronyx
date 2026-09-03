import httpx

from app.config import settings
from app.models.policy import AgentActionDecision


async def submit_decision(decision: AgentActionDecision) -> dict[str, object]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.executor_url}/execute",
            json=decision.model_dump(by_alias=True),
        )
        response.raise_for_status()
        return response.json()
