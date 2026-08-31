export type Agent = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  vaultBalance: string;
  riskThreshold: number;
  spendingLimit: string;

  allowedActions?: string[];
  periodLimit?: string;
  periodLength?: string;
  expiry?: string;
};

export const defaultAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Yield Optimizer",
    status: "ACTIVE",
    vaultBalance: "2.45 SUI",
    riskThreshold: 60,
    spendingLimit: "0.50 SUI",

    allowedActions: ["SWAP", "STAKE"],
    periodLimit: "5.00 SUI",
    periodLength: "24 hours",
    expiry: "30 days",
  },
  {
    id: "agent-2",
    name: "Trading Assistant",
    status: "ACTIVE",
    vaultBalance: "1.20 SUI",
    riskThreshold: 75,
    spendingLimit: "0.30 SUI",

    allowedActions: ["SWAP", "TRANSFER"],
    periodLimit: "3.00 SUI",
    periodLength: "24 hours",
    expiry: "14 days",
  },
];



export function loadAgents(): Agent[] {
  const storedAgents: Agent[] = JSON.parse(
    localStorage.getItem("oronyx-agents") || "[]",
  );

  const storedIds = new Set(storedAgents.map((agent) => agent.id));
  const unchangedDefaults = defaultAgents.filter(
    (agent) => !storedIds.has(agent.id),
  );

  return [...unchangedDefaults, ...storedAgents];
}

export function saveAgent(updatedAgent: Agent) {
  const storedAgents: Agent[] = JSON.parse(
    localStorage.getItem("oronyx-agents") || "[]",
  );

  const exists = storedAgents.some((agent) => agent.id === updatedAgent.id);
  const nextAgents = exists
    ? storedAgents.map((agent) =>
        agent.id === updatedAgent.id ? updatedAgent : agent,
      )
    : [...storedAgents, updatedAgent];

  localStorage.setItem("oronyx-agents", JSON.stringify(nextAgents));
}

