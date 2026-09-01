const AGENT_SERVICE_URL = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL!;

export interface AgentSummary {
  cap_id: string;
  vault_id: string;
  owner: string;
  operator: string;
  active: boolean;
  name: string | null;
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

export async function saveAgentMetadata({
  capId,
  owner,
  name,
}: {
  capId: string;
  owner: string;
  name: string;
}) {
  const response = await fetch(`${AGENT_SERVICE_URL}/agents/metadata`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cap_id: capId,
      owner,
      name,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to save agent metadata: ${await response.text()}`,
    );
  }

  return response.json();
}