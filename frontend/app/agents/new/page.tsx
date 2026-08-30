"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Agent } from "@/lib/agents";

export default function NewAgentPage() {
  const router = useRouter();

  const [agentName, setAgentName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const [parsedPolicy, setParsedPolicy] = useState<null | {
    allowedActions: string[];
    perTxLimit: string;
    periodLimit: string;
    periodLength: string;
    riskThreshold: number;
    expiry: string;
  }>(null);

  function handleParsePolicy() {
    if (!agentName.trim() || !instructions.trim()) return;

    // Temporary mock result. Later this will call POST /parse-policy.
    setParsedPolicy({
      allowedActions: ["SWAP", "STAKE"],
      perTxLimit: "0.50 SUI",
      periodLimit: "5.00 SUI",
      periodLength: "24 hours",
      riskThreshold: 60,
      expiry: "30 days",
    });
    setCreated(false);
  }

  async function handleCreateAgent() {
    if (!parsedPolicy) return;

    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: agentName.trim() || "Unnamed Agent",
      status: "ACTIVE",
      vaultBalance: "0.00 SUI",
      riskThreshold: parsedPolicy.riskThreshold,
      spendingLimit: parsedPolicy.perTxLimit,
    };

    const existingAgents: Agent[] = JSON.parse(
      localStorage.getItem("oronyx-agents") || "[]",
    );

    localStorage.setItem(
      "oronyx-agents",
      JSON.stringify([...existingAgents, newAgent]),
    );

    setIsCreating(false);
    setCreated(true);
  }

  function handleEditInstructions() {
    setParsedPolicy(null);
    setCreated(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-8 py-10">
        <Button
          variant="ghost"
          className="mb-6 -ml-3 rounded-lg"
          onClick={() => router.push("/agents")}
        >
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>

        <div>
          <h1 className="text-3xl font-semibold">Create New Agent</h1>
          <p className="mt-2 text-muted-foreground">
            Define your agent rules using natural language.
          </p>
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Agent Setup</CardTitle>
            <CardDescription>
              Give the agent a name, then describe the policy you want it to follow.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Example: Yield Optimizer"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-instructions">Agent Instructions</Label>
              <Textarea
                id="agent-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Example: Allow swaps up to 0.5 SUI per transaction and flag actions with a risk score above 60."
                className="min-h-40 resize-none"
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleParsePolicy}
              disabled={!agentName.trim() || !instructions.trim()}
              className="rounded-lg"
            >
              <Sparkles className="size-4" />
              Parse Policy
            </Button>
          </CardFooter>
        </Card>

        {parsedPolicy && !created && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardDescription>Parsed Policy</CardDescription>
                  <CardTitle className="mt-1 text-xl">Policy Preview</CardTitle>
                </div>
                <Badge variant="secondary">Mock parser</Badge>
              </div>
              <CardDescription>
                Review the generated policy before creating the agent.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <PolicyRow
                label="Allowed Actions"
                value={parsedPolicy.allowedActions.join(", ")}
              />
              <PolicyRow label="Per-Tx Limit" value={parsedPolicy.perTxLimit} />
              <PolicyRow
                label="Period Spending Limit"
                value={parsedPolicy.periodLimit}
              />
              <PolicyRow label="Period Length" value={parsedPolicy.periodLength} />
              <PolicyRow
                label="Risk Threshold"
                value={String(parsedPolicy.riskThreshold)}
              />
              <PolicyRow label="Expiry" value={parsedPolicy.expiry} last />
            </CardContent>

            <CardFooter className="justify-end gap-3 border-t pt-5">
              <Button
                variant="outline"
                onClick={handleEditInstructions}
                className="rounded-lg"
              >
                Edit Instructions
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="rounded-lg"
              >
                {isCreating ? "Creating..." : "Create Agent"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {created && (
          <Card className="mt-8 border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-400" />
                <CardTitle className="text-emerald-400">Agent Created</CardTitle>
              </div>
              <CardDescription>
                {agentName} has been saved locally and is ready to view on the Agents page.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/agents")} className="rounded-lg">
                View Agents
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}

function PolicyRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${last ? "" : "border-b pb-4"}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
