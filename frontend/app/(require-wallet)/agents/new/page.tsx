"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { Agent } from "@/lib/agents";

const AVAILABLE_ACTIONS = [
  "SWAP",
  "STAKE",
  "TRANSFER",
];

const PERIOD_OPTIONS = [
  "1 hour",
  "6 hours",
  "12 hours",
  "24 hours",
  "7 days",
  "30 days",
];

const EXPIRY_OPTIONS = [
  "7 days",
  "14 days",
  "30 days",
  "60 days",
  "90 days",
];

type ConfigMode =
  | "natural"
  | "advanced";

export default function NewAgentPage() {
  const router = useRouter();

  const [agentName, setAgentName] =
    useState("");

  const [configMode, setConfigMode] =
    useState<ConfigMode>("natural");

  const [instructions, setInstructions] =
    useState("");

  const [isParsing, setIsParsing] =
    useState(false);

  const [selectedActions, setSelectedActions] =
    useState<string[]>([
      "SWAP",
      "STAKE",
    ]);

  const [spendingLimit, setSpendingLimit] =
    useState("0.50");

  const [periodLimit, setPeriodLimit] =
    useState("5.00");

  const [periodLength, setPeriodLength] =
    useState("24 hours");

  const [riskThreshold, setRiskThreshold] =
    useState(60);

  const [expiry, setExpiry] =
    useState("30 days");

  const [isCreating, setIsCreating] =
    useState(false);

  const [created, setCreated] =
    useState(false);

  const [policyGenerated, setPolicyGenerated] = useState(false);

  const numericSpendingLimit =
    Number(spendingLimit);

  const numericPeriodLimit =
    Number(periodLimit);

  const spendingInvalid =
    !Number.isFinite(
      numericSpendingLimit,
    ) ||
    numericSpendingLimit <= 0;

  const periodLimitInvalid =
    !Number.isFinite(
      numericPeriodLimit,
    ) ||
    numericPeriodLimit <= 0;

  const policyInvalid =
  selectedActions.length === 0 ||
  spendingInvalid ||
  periodLimitInvalid ||
  !periodLength ||
  !expiry;

const naturalLanguageInvalid =
  !instructions.trim() ||
  !policyGenerated;

const formInvalid =
  !agentName.trim() ||
  policyInvalid ||
  (configMode === "natural" && naturalLanguageInvalid);

  function toggleAction(
    action: string,
  ) {
    setSelectedActions(
      (current) =>
        current.includes(action)
          ? current.filter(
              (item) =>
                item !== action,
            )
          : [...current, action],
    );
  }

  async function handleGeneratePolicy() {
    if (!agentName.trim()) {
      toast.error(
        "Agent name required",
      );

      return;
    }

    if (!instructions.trim()) {
      toast.error(
        "Describe the policy first",
      );

      return;
    }

    setIsParsing(true);

    /*
     * TEMPORARY MOCK PARSER
     *
     * Later replace this section with:
     *
     * POST /parse-policy
     *
     * from Waiz's agent-service.
     */

    await new Promise((resolve) =>
      setTimeout(resolve, 900),
    );

    setSelectedActions([
      "SWAP",
      "STAKE",
    ]);

    setSpendingLimit("0.50");
    setPeriodLimit("5.00");
    setPeriodLength("24 hours");
    setRiskThreshold(60);
    setExpiry("30 days");

    setPolicyGenerated(true);
setIsParsing(false);
setConfigMode("advanced");

toast.success("Policy generated", {
  description: "Review the generated policy before creating your agent.",
});

    /*
     * After parsing, automatically
     * move the user into Advanced mode
     * so they can review the generated
     * policy.
     */
    setConfigMode("advanced");

    toast.success(
      "Policy generated",
      {
        description:
          "Review the generated policy before creating your agent.",
      },
    );
  }

  async function handleCreateAgent() {
    if (formInvalid) return;

    setIsCreating(true);

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 800),
    );

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: agentName.trim(),
      status: "ACTIVE",
      vaultBalance: "0.00 SUI",

      riskThreshold,

      spendingLimit:
        `${numericSpendingLimit.toFixed(
          2,
        )} SUI`,

      allowedActions:
        selectedActions,

      periodLimit:
        `${numericPeriodLimit.toFixed(
          2,
        )} SUI`,

      periodLength,

      expiry,
    };

    const existingAgents: Agent[] =
      JSON.parse(
        localStorage.getItem(
          "oronyx-agents",
        ) || "[]",
      );

    localStorage.setItem(
      "oronyx-agents",
      JSON.stringify([
        ...existingAgents,
        newAgent,
      ]),
    );

    setIsCreating(false);
    setCreated(true);

    toast.success(
      "Agent created",
      {
        description:
          `${newAgent.name} has been created with the selected policy.`,
      },
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-8 py-10">

        {/* BACK */}

        <Button
          variant="ghost"
          className="mb-6 -ml-3 rounded-lg"
          onClick={() =>
            router.push("/agents")
          }
        >
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>

        {/* HEADER */}

        <div>
          <p className="text-sm text-muted-foreground">
            Autonomous Agent
          </p>

          <h1 className="mt-1 text-3xl font-display">
            Create New Agent
          </h1>

          <p className="mt-2 text-muted-foreground">
            Configure the permissions and
            limits that control your agent.
          </p>
        </div>

        {/* AGENT INFORMATION */}

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>
              Agent Information
            </CardTitle>

            <CardDescription>
              Give your autonomous agent a
              recognizable name.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="agent-name">
                Agent Name
              </Label>

              <Input
                id="agent-name"
                value={agentName}
                onChange={(event) =>
                  setAgentName(
                    event.target.value,
                  )
                }
                placeholder="Example: Yield Optimizer"
              />
            </div>
          </CardContent>
        </Card>

        {/* CONFIGURATION MODE */}

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-muted-foreground" />

              <div>
                <CardTitle>
                  Policy Configuration
                </CardTitle>

                <CardDescription>
                  Create your policy using
                  natural language or configure
                  every rule manually.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs
              value={configMode}
              onValueChange={(value) => {
                if (
                  value === "natural" ||
                  value === "advanced"
                ) {
                  setConfigMode(value);
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="natural">
                  <Sparkles className="size-4" />
                  Natural Language
                </TabsTrigger>

                <TabsTrigger value="advanced">
                  <ShieldCheck className="size-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* NATURAL LANGUAGE */}

              <TabsContent
                value="natural"
                className="mt-6"
              >
                <div className="grid gap-5">
                  <div>
                    <Label htmlFor="instructions">
                      Describe Your Policy
                    </Label>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Explain what the agent is
                      allowed to do using plain
                      language.
                    </p>
                  </div>

                  <Textarea
  id="instructions"
  value={instructions}
  onChange={(event) => {
    setInstructions(event.target.value);
    setPolicyGenerated(false);
  }}
  placeholder="Example: Allow this agent to swap and stake. Limit each transaction to 0.5 SUI, with a total limit of 5 SUI every 24 hours. Flag anything with a risk score above 60."
  className="min-h-40 resize-none"
/>

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-sm font-medium">
                      How it works
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Oronyx interprets your
                      instructions and converts
                      them into a structured
                      policy. You can review and
                      edit every field before the
                      agent is created.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={
                        handleGeneratePolicy
                      }
                      disabled={
                        isParsing ||
                        !agentName.trim() ||
                        !instructions.trim()
                      }
                    >
                      <Sparkles className="size-4" />

                      {isParsing
                        ? "Generating..."
                        : "Generate Policy"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ADVANCED */}

              <TabsContent
                value="advanced"
                className="mt-6"
              >
                <div className="space-y-8">

                  {/* ALLOWED ACTIONS */}

                  <div className="grid gap-4">
                    <div>
                      <Label>
                        Allowed Actions
                      </Label>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Select which actions
                        this agent is allowed
                        to execute.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {AVAILABLE_ACTIONS.map(
                        (action) => {
                          const checked =
                            selectedActions.includes(
                              action,
                            );

                          return (
                            <label
                              key={action}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                                checked
                                  ? "border-primary/40 bg-primary/5"
                                  : "bg-muted/20 hover:bg-muted/40"
                              }`}
                            >
                              <Checkbox
                                checked={
                                  checked
                                }
                                onCheckedChange={() =>
                                  toggleAction(
                                    action,
                                  )
                                }
                              />

                              <span className="font-medium">
                                {action}
                              </span>
                            </label>
                          );
                        },
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedActions.map(
                        (action) => (
                          <Badge
                            key={action}
                            variant="secondary"
                          >
                            {action}
                          </Badge>
                        ),
                      )}
                    </div>

                    {selectedActions.length ===
                      0 && (
                      <p className="text-sm text-destructive">
                        Select at least one
                        allowed action.
                      </p>
                    )}
                  </div>

                  {/* SPENDING LIMITS */}

                  <div className="grid gap-6 md:grid-cols-2">

                    {/* PER TX */}

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
                          value={
                            spendingLimit
                          }
                          onChange={(
                            event,
                          ) =>
                            setSpendingLimit(
                              event.target
                                .value,
                            )
                          }
                          className="pr-14"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          SUI
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Maximum amount allowed
                        in a single transaction.
                      </p>

                      {spendingInvalid && (
                        <p className="text-sm text-destructive">
                          Must be greater than
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
                          value={
                            periodLimit
                          }
                          onChange={(
                            event,
                          ) =>
                            setPeriodLimit(
                              event.target
                                .value,
                            )
                          }
                          className="pr-14"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          SUI
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Total spending allowed
                        during the selected
                        period.
                      </p>

                      {periodLimitInvalid && (
                        <p className="text-sm text-destructive">
                          Must be greater than
                          0 SUI.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PERIOD LENGTH */}

                  <div className="grid gap-2">
                    <Label>
                      Period Length
                    </Label>

                    <Select
                      value={periodLength}
                      onValueChange={(
                        value,
                      ) => {
                        if (
                          typeof value ===
                          "string"
                        ) {
                          setPeriodLength(
                            value,
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          {PERIOD_OPTIONS.map(
                            (option) => (
                              <SelectItem
                                key={option}
                                value={option}
                              >
                                {option}
                              </SelectItem>
                            ),
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-muted-foreground">
                      The spending limit resets
                      after this period.
                    </p>
                  </div>

                  {/* RISK THRESHOLD */}

                  <div className="grid gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Label htmlFor="risk-threshold">
                          Risk Threshold
                        </Label>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Actions above this
                          score may be flagged
                          for review.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          id="risk-threshold"
                          type="number"
                          min={0}
                          max={100}
                          step={5}
                          value={
                            riskThreshold
                          }
                          onChange={(
                            event,
                          ) => {
                            const value =
                              Number(
                                event.target
                                  .value,
                              );

                            if (
                              Number.isFinite(
                                value,
                              ) &&
                              value >= 0 &&
                              value <= 100
                            ) {
                              setRiskThreshold(
                                value,
                              );
                            }
                          }}
                          onBlur={() => {
                            const snapped =
                              Math.round(
                                riskThreshold /
                                  5,
                              ) * 5;

                            setRiskThreshold(
                              Math.min(
                                100,
                                Math.max(
                                  0,
                                  snapped,
                                ),
                              ),
                            );
                          }}
                          className="w-20 text-center"
                        />

                        <Badge variant="secondary">
                          %
                        </Badge>
                      </div>
                    </div>

                    <Slider
                      value={[
                        riskThreshold,
                      ]}
                      onValueChange={(
                        value,
                      ) => {
                        const nextValue =
                          typeof value ===
                          "number"
                            ? value
                            : value[0] ??
                              60;

                        setRiskThreshold(
                          nextValue,
                        );
                      }}
                      min={0}
                      max={100}
                      step={5}
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* EXPIRY */}

                  <div className="grid gap-2">
                    <Label>
                      Policy Expiry
                    </Label>

                    <Select
                      value={expiry}
                      onValueChange={(
                        value,
                      ) =>
                        setExpiry(
                          value ??
                            "30 days",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select expiry" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          {EXPIRY_OPTIONS.map(
                            (option) => (
                              <SelectItem
                                key={option}
                                value={option}
                              >
                                {option}
                              </SelectItem>
                            ),
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-muted-foreground">
                      The agent policy becomes
                      invalid after this
                      duration.
                    </p>
                  </div>

                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* ACTIONS */}

          <CardFooter className="justify-end gap-3 border-t pt-5">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() =>
                router.push("/agents")
              }
            >
              Cancel
            </Button>

            <Button
  className="rounded-lg"
  disabled={
    formInvalid ||
    isCreating ||
    created
  }
  onClick={handleCreateAgent}
>
  <Save className="size-4" />

  {isCreating
    ? "Creating..."
    : created
      ? "Agent Created"
      : configMode === "natural" && !policyGenerated
        ? "Generate Policy First"
        : "Create Agent"}
</Button>
          </CardFooter>
        </Card>

        {/* SUCCESS */}

        {created && (
          <Card className="mt-8 border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-400" />

                <CardTitle className="text-emerald-400">
                  Agent Created
                </CardTitle>
              </div>

              <CardDescription>
                {agentName} has been saved
                locally with its configured
                policy.
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <Button
                onClick={() =>
                  router.push("/agents")
                }
                className="rounded-lg"
              >
                View Agents
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}