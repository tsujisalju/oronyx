from pydantic import BaseModel


class AgentSummary(BaseModel):
    cap_id: str
    vault_id: str
    owner: str
    operator: str
    active: bool


class AgentDetail(BaseModel):
    cap_id: str
    vault_id: str
    owner: str
    operator: str
    active: bool
    spending_limit_per_tx: int
    spending_limit_period: int
    period_spent: int
    period_start_ms: int
    period_length_ms: int
    allowed_actions: list[int]
    allowed_targets: list[str]
    protocol_targets: list[str]
    risk_threshold: int
    expiry_ms: int
    vault_balance: int
