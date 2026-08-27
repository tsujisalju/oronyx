"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Execution {
  risk: number;
}

interface RiskChartProps {
  executions: Execution[];
}

export default function RiskChart({
  executions,
}: RiskChartProps) {
  const data = [
    {
      range: "Low",
      count: executions.filter(
        (execution) => execution.risk < 30
      ).length,
    },
    {
      range: "Medium",
      count: executions.filter(
        (execution) =>
          execution.risk >= 30 &&
          execution.risk < 60
      ).length,
    },
    {
      range: "High",
      count: executions.filter(
        (execution) => execution.risk >= 60
      ).length,
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="text-xl font-semibold">
        Risk Distribution
      </h2>

      <p className="mt-1 text-sm text-zinc-400">
        Execution risk levels
      </p>

      <div className="mt-6 h-72">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
            />

            <XAxis
              dataKey="range"
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

            <Bar
              dataKey="count"
              fill="#ffffff"
              radius={[4, 4, 0, 0]}
            />

          </BarChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}