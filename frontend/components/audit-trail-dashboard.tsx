"use client";

import { useState } from "react";

import StatCard from "./stat-card";
import ExecutionTable from "./execution-table";
import ExecutionChart from "./execution-chart";
import RiskChart from "./risk-chart";
import AgentPerformance from "./agent-performance";

const executions = [
  {
    id: "exec-001",
    agent: "Yield Optimizer",
    action: "SWAP",
    amount: 120,
    risk: 12,
    status: "APPROVED" as const,
    time: "18:00",
  },
  {
    id: "exec-002",
    agent: "Yield Optimizer",
    action: "STAKE",
    amount: 300,
    risk: 18,
    status: "APPROVED" as const,
    time: "18:00",
  },
  {
    id: "exec-003",
    agent: "Trading Assistant",
    action: "SWAP",
    amount: 450,
    risk: 34,
    status: "APPROVED" as const,
    time: "19:00",
  },
  {
    id: "exec-004",
    agent: "Yield Optimizer",
    action: "TRANSFER",
    amount: 900,
    risk: 82,
    status: "FLAGGED" as const,
    time: "19:00",
  },
  {
    id: "exec-005",
    agent: "Trading Assistant",
    action: "SWAP",
    amount: 200,
    risk: 28,
    status: "APPROVED" as const,
    time: "20:00",
  },
  {
    id: "exec-006",
    agent: "Yield Optimizer",
    action: "STAKE",
    amount: 250,
    risk: 22,
    status: "APPROVED" as const,
    time: "20:00",
  },
  {
    id: "exec-007",
    agent: "Trading Assistant",
    action: "TRANSFER",
    amount: 750,
    risk: 71,
    status: "FLAGGED" as const,
    time: "21:00",
  },
  {
    id: "exec-008",
    agent: "Yield Optimizer",
    action: "SWAP",
    amount: 180,
    risk: 15,
    status: "APPROVED" as const,
    time: "21:00",
  },
  {
    id: "exec-009",
    agent: "Trading Assistant",
    action: "SWAP",
    amount: 350,
    risk: 31,
    status: "APPROVED" as const,
    time: "21:00",
  },
  {
    id: "exec-010",
    agent: "Yield Optimizer",
    action: "TRANSFER",
    amount: 600,
    risk: 67,
    status: "FLAGGED" as const,
    time: "22:00",
  },
];

export default function AuditTrailDashboard() {
  // --------------------------------
  // FILTER
  // --------------------------------

  const [selectedAgent, setSelectedAgent] = useState("All Agents");

  const agents = [
    "All Agents",
    ...new Set(executions.map((execution) => execution.agent)),
  ];

  const filteredExecutions =
    selectedAgent === "All Agents"
      ? executions
      : executions.filter((execution) => execution.agent === selectedAgent);

  // --------------------------------
  // ANALYTICS
  // --------------------------------

  const totalExecutions = filteredExecutions.length;

  const approvedExecutions = filteredExecutions.filter(
    (execution) => execution.status === "APPROVED",
  ).length;

  const flaggedExecutions = filteredExecutions.filter(
    (execution) => execution.status === "FLAGGED",
  ).length;

  const approvalRate =
    totalExecutions === 0
      ? 0
      : Math.round((approvedExecutions / totalExecutions) * 100);

  const averageRisk =
    totalExecutions === 0
      ? 0
      : Math.round(
          filteredExecutions.reduce(
            (total, execution) => total + execution.risk,
            0,
          ) / totalExecutions,
        );

  // --------------------------------
  // DASHBOARD
  // --------------------------------

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Oronyx</h1>

            <p className="mt-2 text-zinc-400">
              Autonomous agent control center
            </p>
          </div>

          {/* AGENT FILTER */}

          <div>
            <label className="mb-2 block text-sm text-zinc-400">Agent</label>

            <select
              value={selectedAgent}
              onChange={(event) => setSelectedAgent(event.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white outline-none"
            >
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI CARDS */}

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard title="Active Agents" value={2} />

          <StatCard title="Executions" value={totalExecutions} />

          <StatCard title="Approval Rate" value={approvalRate} />

          <StatCard title="Average Risk" value={averageRisk} />
        </div>

        {/* CHARTS */}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ExecutionChart executions={filteredExecutions} />

          <RiskChart executions={filteredExecutions} />
        </div>

        {/* AGENT PERFORMANCE */}

        <AgentPerformance executions={executions} />

        {/* EXECUTION TABLE */}

        <ExecutionTable executions={filteredExecutions} />
      </div>
    </main>
  );
}
