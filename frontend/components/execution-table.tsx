import { Badge } from "@/components/ui/badge";
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
  action: string;
  amount: number;
  risk: number;
  status: "APPROVED" | "FLAGGED";
}

interface ExecutionTableProps {
  executions: Execution[];
}

export default function ExecutionTable({ executions }: ExecutionTableProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Recent Executions</CardTitle>
        <CardDescription>Latest autonomous actions and policy outcomes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{execution.action}</TableCell>
                <TableCell>{execution.amount} SUI</TableCell>
                <TableCell>{execution.risk}/100</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={
                      execution.status === "APPROVED"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    }
                  >
                    {execution.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
