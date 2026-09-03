"use client";

import { useState } from "react";

import StatCard from "./stat-card";
import ExecutionTable from "./execution-table";
import ExecutionChart from "./execution-chart";
import RiskChart from "./risk-chart";
import AgentPerformance from "./agent-performance";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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

  const riskBand = averageRisk < 30 ? "Low" : averageRisk < 60 ? "Medium" : "High";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-display">Dashboard</h1>
            <p className="mt-2 text-zinc-400">
              Autonomous agent control center
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Period</p>
              <div className="flex rounded-xl border border-border/70 bg-card p-1">
                <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">24H</button>
                {['7D', '30D', 'ALL'].map((period) => (
                  <button
                    key={period}
                    disabled
                    title="Available when historical execution data is connected"
                    className="cursor-not-allowed rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-45"
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-48">
              <p className="mb-2 text-xs font-medium text-zinc-400">Agent</p>
              <Select
                value={selectedAgent}
                onValueChange={(value) => {
                  if (typeof value === "string") setSelectedAgent(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {agents.map((agent) => (
                      <SelectItem key={agent} value={agent}>
                        {agent}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Agents"
            value={selectedAgent === "All Agents" ? agents.length - 1 : 1}
            description={selectedAgent === "All Agents" ? `${agents.length - 1} agents reporting activity` : "Filtered agent"}
          />
          <StatCard
            title="Executions"
            value={totalExecutions}
            description={`${approvedExecutions} approved · ${flaggedExecutions} flagged`}
          />
          <StatCard
            title="Approval Rate"
            value={`${approvalRate}%`}
            description={`${approvedExecutions} of ${totalExecutions} actions approved`}
          />
          <StatCard
            title="Average Risk"
            value={averageRisk}
            description={`${riskBand} risk profile`}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <ExecutionChart executions={filteredExecutions} />
          <RiskChart executions={filteredExecutions} />
        </div>

        <AgentPerformance executions={filteredExecutions} />
        <ExecutionTable executions={filteredExecutions} />
      </div>
    </main>
  );
}
