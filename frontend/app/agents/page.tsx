"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Agent, loadAgents } from "@/lib/agents";

export default function AgentsPage() {
  const [agents] = useState<Agent[]>(loadAgents());

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Agents</h1>
            <p className="mt-2 text-muted-foreground">
              Manage autonomous agents, policies, and vaults.
            </p>
          </div>

          <Link
            href="/agents/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-lg")}
          >
            <Plus className="size-4" />
            Create Agent
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <Card key={agent.id} className="border-border/80 bg-card/80">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="grid gap-1">
                  <CardDescription>Autonomous Agent</CardDescription>
                  <CardTitle className="text-xl">{agent.name}</CardTitle>
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
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">Vault Balance</p>
                <p className="mt-1 text-3xl font-semibold">
                  {agent.vaultBalance}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Risk Threshold
                    </p>
                    <p className="mt-1 font-medium">{agent.riskThreshold}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Per-Tx Limit
                    </p>
                    <p className="mt-1 font-medium">{agent.spendingLimit}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-2 border-t pt-5">
                <Link
                  href={`/agents/${agent.id}`}
                  className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
                >
                  View Agent
                </Link>

                <span className="text-xs text-muted-foreground">
                  Deposit, withdraw, deactivate, and policy controls are
                  available inside.
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
