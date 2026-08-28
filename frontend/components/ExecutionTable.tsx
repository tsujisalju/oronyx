interface Execution {
  action: string;
  amount: number;
  risk: number;
  status: "APPROVED" | "FLAGGED";
}

interface ExecutionTableProps {
  executions: Execution[];
}

export default function ExecutionTable({
  executions,
}: ExecutionTableProps) {
  return (
    <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="text-xl font-semibold">
        Recent Executions
      </h2>

      <div className="mt-6 space-y-3">

        {executions.map((execution, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-4"
          >

            <div>
              <p className="font-medium">
                {execution.action}
              </p>

              <p className="text-sm text-zinc-400">
                {execution.amount} SUI
              </p>
            </div>

            <div className="text-right">

              <p className="text-sm text-zinc-400">
                Risk {execution.risk}/100
              </p>

              <p
                className={
                  execution.status === "APPROVED"
                    ? "text-sm text-green-400"
                    : "text-sm text-orange-400"
                }
              >
                {execution.status}
              </p>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}