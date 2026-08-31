"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Execution {
  time: string;
  status: "APPROVED" | "FLAGGED";
}

interface ExecutionChartProps {
  executions: Execution[];
}

const chartConfig = {
  executions: {
    label: "Executions",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function ExecutionChart({
  executions,
}: ExecutionChartProps) {
  const groupedData = executions.reduce(
  (acc, execution) => {
    const existing = acc.find(
      (item) => item.time === execution.time
    );

    if (existing) {
      existing.executions += 1;
    } else {
      acc.push({
        time: execution.time,
        executions: 1,
      });
    }

    return acc;
  },
  [] as { time: string; executions: number }[]
);

  return (
    <Card>

      <CardHeader>
        <CardTitle className="text-xl">Execution Activity</CardTitle>
        <CardDescription>Agent executions over time</CardDescription>
      </CardHeader>

      <CardContent className="h-80">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart data={groupedData}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
            />

            <XAxis
              dataKey="time"
              stroke="var(--muted-foreground)"
            />

            <YAxis
              allowDecimals={false}
              stroke="var(--muted-foreground)"
            />

            <ChartTooltip content={<ChartTooltipContent />} />

            <Line
              type="monotone"
              dataKey="executions"
              stroke="var(--color-executions)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />

          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}