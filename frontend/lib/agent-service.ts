const AGENT_SERVICE_URL = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL!;

export interface AgentSummary {
  cap_id: string;
  vault_id: string;
  owner: string;
  operator: string;
  active: boolean;
}

export async function listAgents(owner: string): Promise<AgentSummary[]> {
  const response = await fetch(
    `${AGENT_SERVICE_URL}/agents?owner=${owner}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to list agents: ${await response.text()}`);
  }
  return response.json();
}

export interface AgentDetail {
  cap_id: string;
  vault_id: string;
  owner: string;
  operator: string;
  active: boolean;
  spending_limit_per_tx: number;
  spending_limit_period: number;
  period_spent: number;
  period_start_ms: number;
  period_length_ms: number;
  allowed_actions: number[];
  allowed_targets: string[];
  protocol_targets: string[];
  risk_threshold: number;
  expiry_ms: number;
  vault_balance: number;
}

export async function getAgent(capId: string): Promise<AgentDetail | null> {
  const response = await fetch(`${AGENT_SERVICE_URL}/agents/${capId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to get agent: ${await response.text()}`);
  }
  return response.json();
}
