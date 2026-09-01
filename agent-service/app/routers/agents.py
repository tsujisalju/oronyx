from fastapi import APIRouter
from pydantic import BaseModel

from app.models.policy import AgentPolicy, ActionType


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


@router.post("/decide")
def decide():
    # Runtime decision logic will be implemented next.
    return {"status": "not implemented"}