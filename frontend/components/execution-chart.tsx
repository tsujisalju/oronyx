"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Execution {
  time: string;
  status: "APPROVED" | "FLAGGED";
}

interface ExecutionChartProps {
  executions: Execution[];
}

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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={groupedData}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
            />

            <XAxis
              dataKey="time"
              stroke="#71717a"
            />

            <YAxis
              allowDecimals={false}
              stroke="#71717a"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
              }}
            />

            <Line
              type="monotone"
              dataKey="executions"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ r: 4 }}
            />

          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}