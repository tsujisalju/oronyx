"use client";

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

interface Execution {
  agent: string;
  amount: number;
  risk: number;
  status: "APPROVED" | "FLAGGED";
}

interface AgentPerformanceProps {
  executions: Execution[];
}

export default function AgentPerformance({ executions }: AgentPerformanceProps) {
  const agents = [...new Set(executions.map((execution) => execution.agent))];

  const performance = agents.map((agent) => {
    const agentExecutions = executions.filter(
      (execution) => execution.agent === agent,
    );

    const totalExecutions = agentExecutions.length;
    const approved = agentExecutions.filter(
      (execution) => execution.status === "APPROVED",
    ).length;
    const approvalRate =
      totalExecutions === 0 ? 0 : Math.round((approved / totalExecutions) * 100);
    const averageRisk =
      totalExecutions === 0
        ? 0
        : Math.round(
            agentExecutions.reduce(
              (total, execution) => total + execution.risk,
              0,
            ) / totalExecutions,
          );
    const totalVolume = agentExecutions.reduce(
      (total, execution) => total + execution.amount,
      0,
    );

    return {
      agent,
      totalExecutions,
      approvalRate,
      averageRisk,
      totalVolume,
    };
  });

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Agent Performance</CardTitle>
        <CardDescription>
          Performance and risk metrics by autonomous agent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Executions</TableHead>
              <TableHead>Approval Rate</TableHead>
              <TableHead>Avg Risk</TableHead>
              <TableHead>Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.map((agent) => (
              <TableRow key={agent.agent}>
                <TableCell className="font-medium">{agent.agent}</TableCell>
                <TableCell>{agent.totalExecutions}</TableCell>
                <TableCell>{agent.approvalRate}%</TableCell>
                <TableCell>{agent.averageRisk}</TableCell>
                <TableCell>{agent.totalVolume.toLocaleString()} SUI</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
