from pydantic import BaseModel


class AgentSummary(BaseModel):
    cap_id: str
    vault_id: str
    owner: str
    operator: str
    active: bool
