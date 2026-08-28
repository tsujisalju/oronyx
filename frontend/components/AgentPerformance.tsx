"use client";

interface Execution {
  agent: string;
  amount: number;
  risk: number;
  status: "APPROVED" | "FLAGGED";
}

interface AgentPerformanceProps {
  executions: Execution[];
}

export default function AgentPerformance({
  executions,
}: AgentPerformanceProps) {
  const agents = [...new Set(
    executions.map((execution) => execution.agent)
  )];

  const performance = agents.map((agent) => {
    const agentExecutions = executions.filter(
      (execution) => execution.agent === agent
    );

    const totalExecutions = agentExecutions.length;

    const approved = agentExecutions.filter(
      (execution) => execution.status === "APPROVED"
    ).length;

    const approvalRate =
      totalExecutions === 0
        ? 0
        : Math.round((approved / totalExecutions) * 100);

    const averageRisk = Math.round(
      agentExecutions.reduce(
        (total, execution) => total + execution.risk,
        0
      ) / totalExecutions
    );

    const totalVolume = agentExecutions.reduce(
      (total, execution) => total + execution.amount,
      0
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
    <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">

      <div>
        <h2 className="text-xl font-semibold">
          Agent Performance
        </h2>

        <p className="mt-1 text-sm text-zinc-400">
          Performance and risk metrics by autonomous agent
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">

        <table className="w-full text-left">

          <thead>
            <tr className="border-b border-zinc-800 text-sm text-zinc-400">
              <th className="pb-3 font-medium">
                Agent
              </th>

              <th className="pb-3 font-medium">
                Executions
              </th>

              <th className="pb-3 font-medium">
                Approval Rate
              </th>

              <th className="pb-3 font-medium">
                Avg Risk
              </th>

              <th className="pb-3 font-medium">
                Volume
              </th>
            </tr>
          </thead>

          <tbody>

            {performance.map((agent) => (
              <tr
                key={agent.agent}
                className="border-b border-zinc-800 last:border-0"
              >

                <td className="py-4 font-medium">
                  {agent.agent}
                </td>

                <td className="py-4 text-zinc-300">
                  {agent.totalExecutions}
                </td>

                <td className="py-4 text-zinc-300">
                  {agent.approvalRate}%
                </td>

                <td className="py-4 text-zinc-300">
                  {agent.averageRisk}
                </td>

                <td className="py-4 text-zinc-300">
                  {agent.totalVolume.toLocaleString()} SUI
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}