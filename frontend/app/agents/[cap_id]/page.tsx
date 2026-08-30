"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Power, Vault } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Agent, loadAgents, saveAgent } from "@/lib/agents";

export default function AgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.cap_id as string;

  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const foundAgent = loadAgents().find((item) => item.id === agentId);
    setAgent(foundAgent || null);
  }, [agentId]);

  function persist(updatedAgent: Agent) {
    saveAgent(updatedAgent);
    setAgent(updatedAgent);
  }

  function handleDeposit() {
    if (!agent) return;
    const currentBalance = Number.parseFloat(agent.vaultBalance) || 0;
    persist({
      ...agent,
      vaultBalance: `${(currentBalance + 0.5).toFixed(2)} SUI`,
    });
  }

  function handleWithdraw() {
    if (!agent) return;
    const currentBalance = Number.parseFloat(agent.vaultBalance) || 0;
    if (currentBalance < 0.5) return;
    persist({
      ...agent,
      vaultBalance: `${(currentBalance - 0.5).toFixed(2)} SUI`,
    });
  }

  function handleDeactivate() {
    if (!agent) return;
    persist({ ...agent, status: "INACTIVE" });
  }

  if (!agent) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Agent not found</CardTitle>
              <CardDescription>
                The requested agent does not exist in the current mock data.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/agents")} className="rounded-lg">
                Back to Agents
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  const numericBalance = Number.parseFloat(agent.vaultBalance) || 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <Button
          variant="ghost"
          className="mb-6 -ml-3 rounded-lg"
          onClick={() => router.push("/agents")}
        >
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Autonomous Agent</p>
            <h1 className="mt-1 text-3xl font-semibold">{agent.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Manage this agent&apos;s vault, status, and policy.
            </p>
          </div>

          <Badge
            variant="outline"
            className={
              agent.status === "ACTIVE"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }
          >
            {agent.status}
          </Badge>
        </div>

        <Card className="mt-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Vault className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Agent Vault</CardTitle>
                <CardDescription>Mock balance controls for frontend testing.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Vault Balance</p>
            <p className="mt-1 text-3xl font-semibold">{agent.vaultBalance}</p>
          </CardContent>
          <CardFooter className="gap-3 border-t pt-5">
            <Button onClick={handleDeposit} className="rounded-lg">
              Deposit 0.50 SUI
            </Button>
            <Button
              variant="outline"
              onClick={handleWithdraw}
              disabled={numericBalance < 0.5}
              className="rounded-lg"
            >
              Withdraw 0.50 SUI
            </Button>
          </CardFooter>
        </Card>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="grid gap-1">
              <CardDescription>Agent Policy</CardDescription>
              <CardTitle className="text-xl">Policy Configuration</CardTitle>
            </div>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => router.push(`/agents/${agent.id}/edit`)}
            >
              <Pencil className="size-4" />
              Edit Policy
            </Button>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Risk Threshold</p>
              <p className="mt-1 text-lg font-medium">{agent.riskThreshold}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Per-Tx Spending Limit</p>
              <p className="mt-1 text-lg font-medium">{agent.spendingLimit}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
            <CardDescription>
              Deactivating an agent prevents it from performing new actions.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={agent.status === "INACTIVE"}
              className="rounded-lg"
            >
              <Power className="size-4" />
              {agent.status === "INACTIVE" ? "Agent Deactivated" : "Deactivate Agent"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
