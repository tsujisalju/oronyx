import "dotenv/config";
import express, { type Request, type Response } from "express";
import {
  AgentActionDecision,
  executeAgentAction,
} from "./executeAgentAction.js";

const PORT = Number(process.env.ORONYX_EXECUTOR_PORT ?? 4000);

const app = express();
app.use(express.json());

function isValidDecision(body: unknown): body is AgentActionDecision {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.capId !== "string" || typeof b.vaultId !== "string")
    return false;
  if (typeof b.amountMist !== "string" || typeof b.riskScore !== "number")
    return false;

  switch (b.type) {
    case "transfer":
      return typeof b.recipient === "string";
    case "stake":
      return typeof b.validator === "string";
    case "mock_swap":
      return typeof b.mockPoolId === "string";
    case "cetus_swap":
      return (
        typeof b.poolId === "string" &&
        typeof b.decimalsA === "number" &&
        typeof b.decimalsB === "number" &&
        typeof b.slippagePercent === "number"
      );
    default:
      return false;
  }
}

app.post("/execute", async (req: Request, res: Response) => {
  if (!isValidDecision(req.body)) {
    res
      .status(400)
      .json({
        error: "Malformed or unrecognized AgentActionDecision",
        received: req.body,
      });
    return;
  }

  try {
    const result = await executeAgentAction(req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Oronyx executor listening on port ${PORT}`);
});
