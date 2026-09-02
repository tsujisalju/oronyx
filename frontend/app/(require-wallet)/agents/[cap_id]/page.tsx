"use client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import {
  ArrowLeft,
  CircleArrowDown,
  CircleArrowUp,
  Lock,
  Pencil,
  Power,
  Vault,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

import { Slider } from "@/components/ui/slider";

import {
  Agent,
  agentFromDetail,
  MIST_PER_SUI,
  saveMockAgent,
} from "@/lib/agents";
import { getAgent } from "@/lib/agent-service";
import EditableAgentName from "@/components/editable-agent-name";
import { useSuiBalance } from "@/lib/use-sui-balance";
import { signAndExecuteSponsoredTransaction } from "@/lib/sponsored-transaction";

const PACKAGE_ID = process.env.NEXT_PUBLIC_ORONYX_PACKAGE_ID!;

const PERCENT_OPTIONS = [0, 25, 50, 75, 100];

function AgentSkeleton() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <Button variant="ghost" className="mb-6 -ml-3 rounded-lg">
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Autonomous Agent</p>

            <h1 className="mt-1 text-3xl font-semibold font-skeleton animate-pulse">
              Agent 0x1234
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage this agent&apos;s vault, status, and policy.
            </p>
          </div>

          <Badge
            variant="outline"
            className={"border-gray-500/30 bg-gray-500/10 text-gray-400"}
          >
            LOADING
          </Badge>
        </div>

        {/* VAULT */}

        <Card className="mt-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Vault className="size-6 text-muted-foreground" />
              <div>
                <CardTitle>Agent Vault</CardTitle>
                <CardDescription>
                  Deposit and withdraw SUI directly from the agent&apos;s vault.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">Vault Balance</p>

            <p className="mt-1 text-3xl font-skeleton animate-pulse">
              0.00 SUI
            </p>
          </CardContent>
          <CardFooter className="gap-3 border-t pt-5">
            <Button disabled className="rounded-lg">
              Withdraw
            </Button>
            <Button disabled variant="outline" className="rounded-lg">
              Withdraw
            </Button>
          </CardFooter>
        </Card>
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="grid gap-1">
              <CardDescription>Agent Policy</CardDescription>
              <CardTitle className="text-xl">Policy Configuration</CardTitle>
            </div>
            <Button disabled variant="outline" className="rounded-lg">
              <Pencil className="size-4" />
              Edit Policy
            </Button>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Risk Threshold</p>
              <p className="mt-1 text-lg font-skeleton animate-pulse">00</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Per-Tx Spending Limit
              </p>

              <p className="mt-1 text-lg font-skeleton animate-pulse">
                0.00 SUI
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Period Spending Limit
              </p>

              <p className="mt-1 text-lg font-skeleton animate-pulse">
                Not configured
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Period Length</p>

              <p className="mt-1 text-lg font-skeleton animate-pulse">
                Not configured
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Policy Expiry</p>

              <p className="mt-1 text-lg font-skeleton animate-pulse">
                Not configured
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Allowed Actions</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground font-skeleton animate-pulse">
                  Not configured
                </span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 md:col-span-2">
              <p className="text-sm text-muted-foreground">Allowed Targets</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground font-skeleton animate-pulse">
                  Not configured
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>

            <CardDescription>
              Deactivating an agent prevents it from performing new actions
            </CardDescription>
          </CardHeader>

          <CardFooter>
            <Button disabled variant="destructive" className={"rounded-lg"}>
              <Power className="size-4" />
              Deactivate Agent
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

export default function AgentPage() {
  const params = useParams();
  const router = useRouter();
  const account = useCurrentAccount();

  const agentId = params.cap_id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [depositPercent, setDepositPercent] = useState(0);
  const [withdrawPercent, setWithdrawPercent] = useState(0);

  const { balanceMist: walletBalanceMist, refetch: refetchWalletBalance } =
    useSuiBalance(account?.address);

  const loadAgent = async () => {
    try {
      const detail = await getAgent(agentId);
      setAgent(detail ? agentFromDetail(detail) : null);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setIsLoading(true);
        setLoadError(null);
      }
    });

    getAgent(agentId)
      .then((detail) => {
        if (!cancelled) {
          setAgent(detail ? agentFromDetail(detail) : null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  // Activate/Deactivate remain local-mock only (no real transaction) —
  // persist() updates local state + localStorage for this session. Since the
  // page re-fetches real data on mount, these mock mutations won't persist
  // visibly across a reload — a known, accepted limitation until these are
  // wired to real transactions.
  function persist(updatedAgent: Agent) {
    saveMockAgent(updatedAgent);
    setAgent(updatedAgent);
  }

  const isOwner = account?.address === agent?.owner;

  async function handleDeposit() {
    if (!agent?.vaultId || !account) return;

    const amount = Number.parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setIsDepositing(true);

    try {
      const amountMist = Math.round(amount * MIST_PER_SUI);

      const tx = new Transaction();
      tx.setSender(account.address);
      const coin = tx.add(
        coinWithBalance({ balance: amountMist, useGasCoin: false }),
      );
      tx.moveCall({
        target: `${PACKAGE_ID}::capability::deposit`,
        arguments: [tx.object(agent.vaultId), coin],
      });

      const result = await signAndExecuteSponsoredTransaction({
        transaction: tx,
        sender: account.address,
        allowedMoveCallTargets: [`${PACKAGE_ID}::capability::deposit`],
        allowedAddresses: [account.address],
      });

      if (result.$kind !== "Transaction") {
        throw new Error("Sponsored transaction failed");
      }

      await loadAgent();
      refetchWalletBalance();

      toast.success("Deposit successful", {
        description: `${amount.toFixed(2)} SUI was added to ${agent.name}'s vault.`,
      });

      setDepositAmount("");
      setDepositPercent(0);
      setDepositOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to deposit", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDepositing(false);
    }
  }

  async function handleWithdraw() {
    if (!agent?.vaultId || !account) return;

    const amount = Number.parseFloat(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const currentBalanceMist = agent.vaultBalanceMist ?? 0;
    const amountMist = Math.round(amount * MIST_PER_SUI);
    if (amountMist > currentBalanceMist) return;

    setIsWithdrawing(true);

    try {
      const tx = new Transaction();
      const coin = tx.moveCall({
        target: `${PACKAGE_ID}::capability::withdraw`,
        arguments: [tx.object(agent.vaultId), tx.pure.u64(amountMist)],
      });
      tx.transferObjects([coin], tx.pure.address(account.address));

      const result = await signAndExecuteSponsoredTransaction({
        transaction: tx,
        sender: account.address,
        allowedMoveCallTargets: [`${PACKAGE_ID}::capability::withdraw`],
        allowedAddresses: [account.address],
      });

      if (result.$kind !== "Transaction") {
        throw new Error("Sponsored transaction failed");
      }

      await loadAgent();
      refetchWalletBalance();

      toast.success("Withdrawal successful", {
        description: `${amount.toFixed(2)} SUI was withdrawn from ${agent.name}'s vault.`,
      });

      setWithdrawAmount("");
      setWithdrawPercent(0);
      setWithdrawOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to withdraw", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsWithdrawing(false);
    }
  }

  function handleDeactivate() {
    if (!agent) return;

    persist({
      ...agent,
      status: "INACTIVE",
    });

    toast.success("Agent deactivated", {
      description: `${agent.name} can no longer perform autonomous actions.`,
    });
  }

  function handleActivate() {
    if (!agent) return;

    persist({
      ...agent,
      status: "ACTIVE",
    });

    toast.success("Agent activated", {
      description: `${agent.name} can perform autonomous actions again.`,
    });
  }

  if (isLoading) {
    return <AgentSkeleton />;
  }

  if (loadError || !agent) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <Card>
            <CardHeader>
              <CardTitle>
                {loadError ? "Failed to load agent" : "Agent not found"}
              </CardTitle>

              <CardDescription>
                {loadError ??
                  "No agent exists with this ID, or it hasn't been indexed yet."}
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <Button
                onClick={() => router.push("/agents")}
                className="rounded-lg"
              >
                Back to Agents
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  const vaultBalanceMist = agent.vaultBalanceMist ?? 0;
  const numericBalance = vaultBalanceMist / MIST_PER_SUI;

  function applyDepositPercent(percent: number) {
    setDepositPercent(percent);
    if (walletBalanceMist == null) return;
    setDepositAmount(
      ((walletBalanceMist * percent) / 100 / MIST_PER_SUI).toFixed(2),
    );
  }

  function applyWithdrawPercent(percent: number) {
    setWithdrawPercent(percent);
    setWithdrawAmount(
      ((vaultBalanceMist * percent) / 100 / MIST_PER_SUI).toFixed(2),
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10">
        {/* BACK BUTTON */}

        <Button
          variant="ghost"
          className="mb-6 -ml-3 rounded-lg"
          onClick={() => router.push("/agents")}
        >
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Autonomous Agent</p>

            <h1 className="mt-1 text-3xl font-semibold">
              <EditableAgentName
                name={agent.name}
                capId={agent.capId}
                owner={agent.owner}
                onSaved={(newName) =>
                  setAgent({ ...agent, name: newName, hasName: true })
                }
              />
            </h1>

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

        {/* VAULT */}

        <Card className="mt-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Vault className="size-6 text-muted-foreground" />
              <div>
                <CardTitle>Agent Vault</CardTitle>
                <CardDescription>
                  Deposit and withdraw SUI directly from the agent&apos;s vault.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">Vault Balance</p>

            <p className="mt-1 text-3xl font-semibold">{agent.vaultBalance}</p>

            {!isOwner && (
              <p className="mt-2 text-sm text-destructive">
                Only the vault&apos;s owner can deposit or withdraw funds.
              </p>
            )}
          </CardContent>

          <CardFooter className="gap-3 border-t pt-5">
            {/* DEPOSIT */}

            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger
                render={<Button className="rounded-lg" disabled={!isOwner} />}
              >
                Deposit
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit to Vault</DialogTitle>

                  <DialogDescription>
                    Add SUI to {agent.name}&apos;s vault.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="deposit-amount">Amount</Label>

                    <div className="relative">
                      <Input
                        id="deposit-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={depositAmount}
                        onChange={(event) =>
                          setDepositAmount(event.target.value)
                        }
                        placeholder="0.00"
                        className="pr-14"
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        SUI
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Slider
                      value={[depositPercent]}
                      onValueChange={(value) => {
                        const pct = Array.isArray(value) ? value[0] : value;
                        if (typeof pct === "number") applyDepositPercent(pct);
                      }}
                      min={0}
                      max={100}
                      step={5}
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      {PERCENT_OPTIONS.map((percent) => (
                        <span key={percent}>{percent}%</span>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Wallet Balance:{" "}
                      {walletBalanceMist != null
                        ? `${(walletBalanceMist / MIST_PER_SUI).toFixed(2)} SUI`
                        : "—"}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <CircleArrowDown className="text-muted-foreground" />
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">
                      Current Vault Balance
                    </p>

                    <p className="mt-1 font-medium">{agent.vaultBalance}</p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDepositOpen(false);
                      setDepositAmount("");
                      setDepositPercent(0);
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleDeposit}
                    disabled={
                      !Number.isFinite(Number.parseFloat(depositAmount)) ||
                      Number.parseFloat(depositAmount) <= 0 ||
                      isDepositing
                    }
                  >
                    {isDepositing ? "Depositing..." : "Deposit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* WITHDRAW */}

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    className="rounded-lg"
                    disabled={!isOwner}
                  />
                }
              >
                Withdraw
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw from Vault</DialogTitle>

                  <DialogDescription>
                    Withdraw SUI from {agent.name}&apos;s vault.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="withdraw-amount">Amount</Label>

                    <div className="relative">
                      <Input
                        id="withdraw-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(event) =>
                          setWithdrawAmount(event.target.value)
                        }
                        placeholder="0.00"
                        className="pr-14"
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        SUI
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Slider
                      value={[withdrawPercent]}
                      onValueChange={(value) => {
                        const pct = Array.isArray(value) ? value[0] : value;
                        if (typeof pct === "number") applyWithdrawPercent(pct);
                      }}
                      min={0}
                      max={100}
                      step={25}
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      {PERCENT_OPTIONS.map((percent) => (
                        <span key={percent}>{percent}%</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <CircleArrowUp className="text-muted-foreground" />
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">
                      Available Vault Balance
                    </p>

                    <p className="mt-1 font-medium">{agent.vaultBalance}</p>
                  </div>

                  {Number.parseFloat(withdrawAmount) > numericBalance && (
                    <p className="text-sm text-destructive">
                      Withdrawal amount exceeds the available balance.
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setWithdrawOpen(false);
                      setWithdrawAmount("");
                      setWithdrawPercent(0);
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleWithdraw}
                    disabled={
                      !Number.isFinite(Number.parseFloat(withdrawAmount)) ||
                      Number.parseFloat(withdrawAmount) <= 0 ||
                      Number.parseFloat(withdrawAmount) > numericBalance ||
                      isWithdrawing
                    }
                  >
                    {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {/* POLICY */}

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
              <p className="text-sm text-muted-foreground">
                Per-Tx Spending Limit
              </p>

              <p className="mt-1 text-lg font-medium">{agent.spendingLimit}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Period Spending Limit
              </p>

              <p className="mt-1 text-lg font-medium">
                {agent.periodLimit ?? "Not configured"}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Period Length</p>

              <p className="mt-1 text-lg font-medium">
                {agent.periodLength ?? "Not configured"}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Policy Expiry</p>

              <p className="mt-1 text-lg font-medium">
                {agent.expiry ?? "Not configured"}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Allowed Actions</p>

              <div className="mt-2 flex flex-wrap gap-2">
                {agent.allowedActions?.length ? (
                  agent.allowedActions.map((action) => (
                    <Badge key={action} variant="secondary">
                      {action}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not configured
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 md:col-span-2">
              <p className="text-sm text-muted-foreground">Allowed Targets</p>

              <div className="mt-2 flex flex-wrap gap-2">
                {agent.allowedTargets?.length ? (
                  agent.allowedTargets.map((target) => {
                    const isProtocol =
                      agent.protocolTargets?.includes(target) ?? false;

                    return (
                      <Badge
                        key={target}
                        variant={isProtocol ? "outline" : "secondary"}
                        title={target}
                        className="gap-1"
                      >
                        {isProtocol && <Lock className="size-3" />}
                        {`${target.slice(0, 6)}…${target.slice(-4)}`}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not configured
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AGENT STATUS */}

        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>

            <CardDescription>
              {agent.status === "ACTIVE"
                ? "Deactivating an agent prevents it from performing new actions."
                : "This agent is inactive and cannot perform autonomous actions."}
            </CardDescription>
          </CardHeader>

          <CardFooter>
            {agent.status === "ACTIVE" ? (
              <AlertDialog key="deactivate-dialog">
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive" className="rounded-lg" />
                  }
                >
                  <Power className="size-4" />
                  Deactivate Agent
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Deactivate {agent.name}?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                      This agent will no longer be able to perform new actions.
                      Its current policy and vault information will be
                      preserved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                      onClick={handleDeactivate}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      <Power className="size-4" />
                      Deactivate Agent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog key="activate-dialog">
                <AlertDialogTrigger render={<Button className="rounded-lg" />}>
                  <Power className="size-4" />
                  Activate Agent
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Activate {agent.name}?</AlertDialogTitle>

                    <AlertDialogDescription>
                      This agent will be allowed to perform autonomous actions
                      again according to its current policy.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction onClick={handleActivate}>
                      <Power className="size-4" />
                      Activate Agent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
