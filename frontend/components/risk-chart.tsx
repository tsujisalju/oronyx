"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Execution {
  risk: number;
}

interface RiskChartProps {
  executions: Execution[];
}

const chartConfig = {
  low: {
    label: "Low",
    color: "var(--color-emerald-500)",
  },
  medium: {
    label: "Medium",
    color: "var(--color-amber-500)",
  },
  high: {
    label: "High",
    color: "var(--color-red-500)",
  },
} satisfies ChartConfig;

export default function RiskChart({ executions }: RiskChartProps) {
  const data = [
    {
      range: "Low",
      bucket: "low",
      count: executions.filter((execution) => execution.risk < 30).length,
    },
    {
      range: "Medium",
      bucket: "medium",
      count: executions.filter(
        (execution) => execution.risk >= 30 && execution.risk < 60,
      ).length,
    },
    {
      range: "High",
      bucket: "high",
      count: executions.filter((execution) => execution.risk >= 60).length,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Risk Distribution</CardTitle>
        <CardDescription>Execution risk levels</CardDescription>
      </CardHeader>

      <CardContent className="h-80">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="range" stroke="var(--muted-foreground)" />
            <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.bucket} fill={`var(--color-${entry.bucket})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
