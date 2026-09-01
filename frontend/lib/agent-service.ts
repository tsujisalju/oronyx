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
