"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  History,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type AuditStatus =
  | "FLAGGED"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED";

type AuditAction =
  | "SWAP"
  | "STAKE"
  | "TRANSFER";

type AuditRecord = {
  id: string;
  agentName: string;
  action: AuditAction;
  amount: string;
  riskScore: number;
  reason: string;
  status: AuditStatus;
  timestamp: string;
};

const initialRecords: AuditRecord[] = [
  {
    id: "audit-1",
    agentName: "Yield Optimizer",
    action: "SWAP",
    amount: "0.45 SUI",
    riskScore: 82,
    reason:
      "Risk score exceeded the configured threshold.",
    status: "FLAGGED",
    timestamp: "2 minutes ago",
  },
  {
    id: "audit-2",
    agentName: "Trading Assistant",
    action: "TRANSFER",
    amount: "0.28 SUI",
    riskScore: 76,
    reason:
      "Transfer target requires manual approval.",
    status: "FLAGGED",
    timestamp: "8 minutes ago",
  },
  {
    id: "audit-3",
    agentName: "Yield Optimizer",
    action: "STAKE",
    amount: "0.30 SUI",
    riskScore: 31,
    reason:
      "Action completed within configured policy.",
    status: "EXECUTED",
    timestamp: "18 minutes ago",
  },
  {
    id: "audit-4",
    agentName: "Trading Assistant",
    action: "SWAP",
    amount: "0.20 SUI",
    riskScore: 68,
    reason:
      "Previously reviewed by the operator.",
    status: "APPROVED",
    timestamp: "27 minutes ago",
  },
];

export default function AuditPage() {
  const [records, setRecords] =
    useState<AuditRecord[]>(initialRecords);

  const pendingRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.status === "FLAGGED",
      ),
    [records],
  );

  const historyRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.status !== "FLAGGED",
      ),
    [records],
  );

  function approveRecord(id: string) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              status: "APPROVED",
              timestamp: "Just now",
            }
          : record,
      ),
    );

    toast.success("Action approved", {
      description:
        "The flagged action has been approved for execution.",
    });
  }

  function rejectRecord(id: string) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              status: "REJECTED",
              timestamp: "Just now",
            }
          : record,
      ),
    );

    toast.error("Action rejected", {
      description:
        "The flagged action has been rejected.",
    });
  }

  function getRiskVariant(
    score: number,
  ):
    | "default"
    | "secondary"
    | "destructive"
    | "outline" {
    if (score >= 75) {
      return "destructive";
    }

    if (score >= 50) {
      return "outline";
    }

    return "secondary";
  }

  function getStatusVariant(
    status: AuditStatus,
  ):
    | "default"
    | "secondary"
    | "destructive"
    | "outline" {
    switch (status) {
      case "APPROVED":
        return "default";

      case "REJECTED":
        return "destructive";

      case "EXECUTED":
        return "secondary";

      case "FLAGGED":
      default:
        return "outline";
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-8 py-10">

        {/* HEADER */}

        <div>
          <p className="text-sm text-muted-foreground">
            Human Oversight
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Audit Trail
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Review high-risk autonomous actions,
            approve or reject flagged requests,
            and inspect recent agent activity.
          </p>
        </div>

        {/* SUMMARY CARDS */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Pending Review
              </CardDescription>

              <CardTitle className="text-3xl">
                {pendingRecords.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Approved
              </CardDescription>

              <CardTitle className="text-3xl">
                {
                  records.filter(
                    (record) =>
                      record.status ===
                      "APPROVED",
                  ).length
                }
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Rejected
              </CardDescription>

              <CardTitle className="text-3xl">
                {
                  records.filter(
                    (record) =>
                      record.status ===
                      "REJECTED",
                  ).length
                }
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* PENDING APPROVALS */}

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 text-muted-foreground" />

              <div>
                <CardTitle>
                  Pending Approvals
                </CardTitle>

                <CardDescription>
                  These actions were flagged by
                  the policy engine and require
                  human review.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {pendingRecords.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Check className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 font-medium">
                  No pending approvals
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  All flagged actions have been
                  reviewed.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Agent
                      </TableHead>

                      <TableHead>
                        Action
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Risk
                      </TableHead>

                      <TableHead>
                        Reason
                      </TableHead>

                      <TableHead>
                        Time
                      </TableHead>

                      <TableHead className="text-right">
                        Decision
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {pendingRecords.map(
                      (record) => (
                        <TableRow
                          key={record.id}
                        >
                          <TableCell className="font-medium">
                            {
                              record.agentName
                            }
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary">
                              {
                                record.action
                              }
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {record.amount}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={getRiskVariant(
                                record.riskScore,
                              )}
                            >
                              {
                                record.riskScore
                              }
                              /100
                            </Badge>
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                              <span className="text-sm text-muted-foreground">
                                {
                                  record.reason
                                }
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {
                              record.timestamp
                            }
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-2">

                              {/* REJECT */}

                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button
                                      variant="outline"
                                      size="sm"
                                    />
                                  }
                                >
                                  <X className="size-4" />
                                  Reject
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Reject action?
                                    </AlertDialogTitle>

                                    <AlertDialogDescription>
                                      This will
                                      reject the{" "}
                                      {
                                        record.action
                                      }{" "}
                                      request from{" "}
                                      {
                                        record.agentName
                                      }
                                      .
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>

                                    <AlertDialogAction
                                      variant="destructive"
                                      onClick={() =>
                                        rejectRecord(
                                          record.id,
                                        )
                                      }
                                    >
                                      Reject Action
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              {/* APPROVE */}

                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button
                                      size="sm"
                                    />
                                  }
                                >
                                  <Check className="size-4" />
                                  Approve
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Approve action?
                                    </AlertDialogTitle>

                                    <AlertDialogDescription>
                                      Approve this{" "}
                                      {
                                        record.action
                                      }{" "}
                                      request for{" "}
                                      {
                                        record.amount
                                      }
                                      ?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>

                                    <AlertDialogAction
                                      onClick={() =>
                                        approveRecord(
                                          record.id,
                                        )
                                      }
                                    >
                                      Approve Action
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* HISTORY */}

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <History className="size-5 text-muted-foreground" />

              <div>
                <CardTitle>
                  Recent Activity
                </CardTitle>

                <CardDescription>
                  Previously executed and reviewed
                  autonomous actions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Agent
                    </TableHead>

                    <TableHead>
                      Action
                    </TableHead>

                    <TableHead>
                      Amount
                    </TableHead>

                    <TableHead>
                      Risk
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Time
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {historyRecords.map(
                    (record) => (
                      <TableRow
                        key={record.id}
                      >
                        <TableCell className="font-medium">
                          {
                            record.agentName
                          }
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            {
                              record.action
                            }
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {record.amount}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={getRiskVariant(
                              record.riskScore,
                            )}
                          >
                            {
                              record.riskScore
                            }
                            /100
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={getStatusVariant(
                              record.status,
                            )}
                          >
                            {
                              record.status
                            }
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {
                            record.timestamp
                          }
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}