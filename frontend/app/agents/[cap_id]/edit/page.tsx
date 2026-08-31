"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

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

import {
  Agent,
  loadAgents,
  saveAgent,
} from "@/lib/agents";

export default function EditAgentPolicyPage() {
  const params = useParams();
  const router = useRouter();

  const agentId = params.cap_id as string;

  const [agent, setAgent] = useState<Agent | null>(null);

  const [spendingLimit, setSpendingLimit] = useState("");
  const [periodLimit, setPeriodLimit] = useState("");
  const [periodLength, setPeriodLength] = useState("");
  const [riskThreshold, setRiskThreshold] = useState("");
  const [expiry, setExpiry] = useState("");
  const [allowedActions, setAllowedActions] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const foundAgent = loadAgents().find(
      (item) => item.id === agentId,
    );

    if (!foundAgent) {
      setAgent(null);
      return;
    }

    setAgent(foundAgent);

    setSpendingLimit(
      foundAgent.spendingLimit.replace(" SUI", ""),
    );

    setPeriodLimit(
      foundAgent.periodLimit?.replace(" SUI", "") ?? "",
    );

    setPeriodLength(foundAgent.periodLength ?? "");

    setRiskThreshold(
      String(foundAgent.riskThreshold),
    );

    setExpiry(foundAgent.expiry ?? "");

    setAllowedActions(
      foundAgent.allowedActions?.join(", ") ?? "",
    );
  }, [agentId]);

  if (!agent) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-8 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Agent not found</CardTitle>

              <CardDescription>
                The requested agent does not exist.
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <Button
                onClick={() => router.push("/agents")}
              >
                Back to Agents
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  const numericRisk = Number(riskThreshold);
  const numericSpendingLimit = Number(spendingLimit);
  const numericPeriodLimit = Number(periodLimit);

  const riskInvalid =
    !Number.isFinite(numericRisk) ||
    numericRisk < 0 ||
    numericRisk > 100;

  const spendingInvalid =
    !Number.isFinite(numericSpendingLimit) ||
    numericSpendingLimit <= 0;

  const periodLimitInvalid =
    !Number.isFinite(numericPeriodLimit) ||
    numericPeriodLimit <= 0;

  const formInvalid =
    riskInvalid ||
    spendingInvalid ||
    periodLimitInvalid ||
    !periodLength.trim() ||
    !expiry.trim() ||
    !allowedActions.trim();

  async function handleSavePolicy() {
    if (!agent || formInvalid) return;

    setIsSaving(true);

    // Temporary delay to simulate a real transaction/API call.
    await new Promise((resolve) =>
      setTimeout(resolve, 600),
    );

    const actions = allowedActions
      .split(",")
      .map((action) =>
        action.trim().toUpperCase(),
      )
      .filter(Boolean);

    const updatedAgent: Agent = {
      ...agent,

      spendingLimit: `${numericSpendingLimit.toFixed(
        2,
      )} SUI`,

      periodLimit: `${numericPeriodLimit.toFixed(
        2,
      )} SUI`,

      periodLength: periodLength.trim(),

      riskThreshold: numericRisk,

      expiry: expiry.trim(),

      allowedActions: actions,
    };

    saveAgent(updatedAgent);
    setAgent(updatedAgent);

    setIsSaving(false);

    toast.success("Policy updated", {
      description: `${agent.name}'s policy configuration has been saved.`,
    });

    router.push(`/agents/${agent.id}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-8 py-10">

        {/* BACK */}

        <Button
          variant="ghost"
          className="mb-6 -ml-3 rounded-lg"
          onClick={() =>
            router.push(`/agents/${agent.id}`)
          }
        >
          <ArrowLeft className="size-4" />
          Back to Agent
        </Button>

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Agent Policy
            </p>

            <h1 className="mt-1 text-3xl font-semibold">
              Edit Policy
            </h1>

            <p className="mt-2 text-muted-foreground">
              Update the limits and permissions that
              control {agent.name}.
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

        {/* POLICY FORM */}

        <Card className="mt-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-muted-foreground" />

              <div>
                <CardTitle>
                  Policy Configuration
                </CardTitle>

                <CardDescription>
                  These values currently update local
                  mock data. Later they can be connected
                  to Oronyx&apos;s Move contract.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* PER TX LIMIT */}

            <div className="grid gap-2">
              <Label htmlFor="spending-limit">
                Per-Tx Spending Limit
              </Label>

              <div className="relative">
                <Input
                  id="spending-limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={spendingLimit}
                  onChange={(event) =>
                    setSpendingLimit(
                      event.target.value,
                    )
                  }
                  className="pr-14"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  SUI
                </span>
              </div>

              {spendingInvalid && (
                <p className="text-sm text-destructive">
                  Spending limit must be greater than
                  0 SUI.
                </p>
              )}
            </div>

            {/* PERIOD LIMIT */}

            <div className="grid gap-2">
              <Label htmlFor="period-limit">
                Period Spending Limit
              </Label>

              <div className="relative">
                <Input
                  id="period-limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={periodLimit}
                  onChange={(event) =>
                    setPeriodLimit(
                      event.target.value,
                    )
                  }
                  className="pr-14"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  SUI
                </span>
              </div>

              {periodLimitInvalid && (
                <p className="text-sm text-destructive">
                  Period spending limit must be greater
                  than 0 SUI.
                </p>
              )}
            </div>

            {/* PERIOD LENGTH */}

            <div className="grid gap-2">
              <Label htmlFor="period-length">
                Period Length
              </Label>

              <Input
                id="period-length"
                value={periodLength}
                onChange={(event) =>
                  setPeriodLength(
                    event.target.value,
                  )
                }
                placeholder="Example: 24 hours"
              />

              <p className="text-xs text-muted-foreground">
                Example: 24 hours, 7 days, 30 days
              </p>
            </div>

            {/* RISK THRESHOLD */}

            <div className="grid gap-2">
              <Label htmlFor="risk-threshold">
                Risk Threshold
              </Label>

              <Input
                id="risk-threshold"
                type="number"
                min="0"
                max="100"
                value={riskThreshold}
                onChange={(event) =>
                  setRiskThreshold(
                    event.target.value,
                  )
                }
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Actions above this score may be
                  flagged for review.
                </p>

                <span className="text-sm font-medium">
                  {riskThreshold || "0"} / 100
                </span>
              </div>

              {riskInvalid && (
                <p className="text-sm text-destructive">
                  Risk threshold must be between 0 and
                  100.
                </p>
              )}
            </div>

            {/* EXPIRY */}

            <div className="grid gap-2">
              <Label htmlFor="expiry">
                Policy Expiry
              </Label>

              <Input
                id="expiry"
                value={expiry}
                onChange={(event) =>
                  setExpiry(event.target.value)
                }
                placeholder="Example: 30 days"
              />
            </div>

            {/* ALLOWED ACTIONS */}

            <div className="grid gap-2">
              <Label htmlFor="allowed-actions">
                Allowed Actions
              </Label>

              <Input
                id="allowed-actions"
                value={allowedActions}
                onChange={(event) =>
                  setAllowedActions(
                    event.target.value,
                  )
                }
                placeholder="SWAP, STAKE, TRANSFER"
              />

              <p className="text-xs text-muted-foreground">
                Separate multiple actions using commas.
              </p>

              {allowedActions.trim() && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {allowedActions
                    .split(",")
                    .map((action) =>
                      action.trim(),
                    )
                    .filter(Boolean)
                    .map((action) => (
                      <Badge
                        key={action}
                        variant="secondary"
                      >
                        {action.toUpperCase()}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-3 border-t pt-5">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() =>
                router.push(
                  `/agents/${agent.id}`,
                )
              }
            >
              Cancel
            </Button>

            <Button
              className="rounded-lg"
              disabled={
                formInvalid || isSaving
              }
              onClick={handleSavePolicy}
            >
              <Save className="size-4" />

              {isSaving
                ? "Saving..."
                : "Save Policy"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}