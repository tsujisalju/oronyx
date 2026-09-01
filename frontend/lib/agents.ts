import { AgentDetail, AgentSummary } from "./agent-service";

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

  // Real on-chain object IDs from oronyx::capability::create_agent_cap.
  // `id` is set equal to `capId` once an agent is chain-backed, since
  // app/(require-wallet)/agents/[cap_id]/page.tsx already routes on
  // `cap_id`. Optional for the still-present mock seed agents.
  capId?: string;
  vaultId?: string;
};

// GET /agents (agent-service) only returns identity/active-status today —
// no name/riskThreshold/spendingLimit/vaultBalance yet. These placeholders
// are interim until a dedicated agent-details endpoint fills them in;
// riskThreshold's -1 sentinel signals "not yet available" to AgentCard
// (a real threshold is always 0-100).
export function agentFromSummary(summary: AgentSummary): Agent {
  return {
    id: summary.cap_id,
    capId: summary.cap_id,
    vaultId: summary.vault_id,
    name:
  summary.name ??
  `Agent ${summary.cap_id.slice(0, 6)}…${summary.cap_id.slice(-4)}`,
    status: summary.active ? "ACTIVE" : "INACTIVE",
    vaultBalance: "—",
    riskThreshold: -1,
    spendingLimit: "—",
  };
}

export const MIST_PER_SUI = 1_000_000_000;

export function formatMist(mist: number): string {
  return `${(mist / MIST_PER_SUI).toFixed(2)} SUI`;
}

// Mirrors oronyx::capability's action-type codes (see move/sources/capability.move
// and the ACTION_CODES map in agents/new/page.tsx, which only exposes SWAP/STAKE/
// TRANSFER in its UI — CETUS_SWAP is included here since a cap can still carry it).
export const ACTION_LABELS: Record<number, string> = {
  0: "TRANSFER",
  1: "SWAP",
  2: "STAKE",
  3: "CETUS_SWAP",
};

// Generic duration formatter — period_length_ms can be any value, not just
// the fixed set of options agents/new/page.tsx's form offers, so this
// computes whole days/hours directly rather than reverse-looking-up that
// form's private DURATION_MS table.
export function formatDuration(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours >= 24 && hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (Number.isInteger(hours)) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${Math.round(ms / 60_000)} minutes`;
}

// expiry_ms is an absolute epoch timestamp, not a duration — must be
// formatted as a date, not passed through formatDuration.
export function formatExpiry(expiryMs: number): string {
  return new Date(expiryMs).toLocaleString();
}

export function agentFromDetail(detail: AgentDetail): Agent {
  return {
    id: detail.cap_id,
    capId: detail.cap_id,
    vaultId: detail.vault_id,
    name: `Agent ${detail.cap_id.slice(0, 6)}…${detail.cap_id.slice(-4)}`,
    status: detail.active ? "ACTIVE" : "INACTIVE",
    vaultBalance: formatMist(detail.vault_balance),
    riskThreshold: detail.risk_threshold,
    spendingLimit: formatMist(detail.spending_limit_per_tx),
    allowedActions: detail.allowed_actions.map(
      (code) => ACTION_LABELS[code] ?? `ACTION_${code}`,
    ),
    periodLimit: formatMist(detail.spending_limit_period),
    periodLength: formatDuration(detail.period_length_ms),
    expiry: formatExpiry(detail.expiry_ms),
  };
}

export const mockAgents: Agent[] = [
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

export function loadMockAgents(): Agent[] {
  const storedAgents: Agent[] = JSON.parse(
    localStorage.getItem("oronyx-agents") || "[]",
  );

  const storedIds = new Set(storedAgents.map((agent) => agent.id));
  const unchangedDefaults = mockAgents.filter(
    (agent) => !storedIds.has(agent.id),
  );

  return [...unchangedDefaults, ...storedAgents];
}

export function saveMockAgent(updatedAgent: Agent) {
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
