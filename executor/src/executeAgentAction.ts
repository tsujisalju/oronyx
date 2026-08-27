import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import CetusClmmSDK from "@cetusprotocol/sui-clmm-sdk";
import { Percentage, adjustForSlippage, d } from "@cetusprotocol/common-sdk";
import BN from "bn.js";

const PACKAGE_ID = process.env.ORONYX_PACKAGE_ID!;
const OPERATOR_PRIVATE_KEY = process.env.ORONYX_OPERATOR_KEY!; // suiprivkey1...
const FULLNODE_BASE_URL =
  process.env.ORONYX_FULLNODE_URL ?? "https://fullnode.testnet.sui.io:443";
const NETWORK = "testnet" as const;

interface AgentActionDecision {
  capId: string;
  vaultId: string;
  clockId: string; // 0x6, the shared Clock object
  actionType: number; // 0 = transfer, 1 = swap, 2 = stake
  poolId: string; // Cetus pool object id AND the `target` policy check value
  coinTypeA: string; // e.g. "0x2::sui::SUI"
  coinTypeB: string; // e.g. Cetus testnet USDC type
  decimalsA: number;
  decimalsB: number;
  amountMist: string; // decided amount, already converted from SUI by agent-service
  riskScore: number;
  slippagePercent: number; // e.g. 5 for 5%, matches d(5) style in Cetus docs
}

// Step 1: policy check + fund release. Returns the released amount's tx digest.
async function runPolicyCheck(
  client: SuiGrpcClient,
  operatorKeypair: Ed25519Keypair,
  decision: AgentActionDecision,
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::capability::execute_action_and_transfer_to_operator`,
    arguments: [
      tx.object(decision.capId),
      tx.object(decision.vaultId),
      tx.pure.u8(decision.actionType),
      tx.pure.address(decision.poolId),
      tx.pure.u64(decision.amountMist),
      tx.pure.u8(decision.riskScore),
      tx.object(decision.clockId),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    signer: operatorKeypair,
    transaction: tx,
  });
  return result;
}

// Step 2: oridnary Cetus swap, run against the operator's own balance.
async function runCetusSwap(
  client: SuiGrpcClient,
  operatorKeypair: Ed25519Keypair,
  decision: AgentActionDecision,
) {
  const sdk = CetusClmmSDK.createSDK({ env: NETWORK });

  const pool = await sdk.Pool.getPool(decision.poolId);
  const a2b = true;
  const byAmountIn = true;

  const preSwapRes: any = await sdk.Swap.preSwap({
    pool,
    current_sqrt_price: pool.current_sqrt_price,
    coin_type_a: pool.coin_type_a,
    coin_type_b: pool.coin_type_b,
    decimals_a: decision.decimalsA,
    decimals_b: decision.decimalsB,
    a2b,
    by_amount_in: byAmountIn,
    amount: decision.amountMist,
  });

  const slippage = Percentage.fromDecimal(d(decision.slippagePercent));
  const toAmount = byAmountIn
    ? preSwapRes.estimated_amount_out
    : preSwapRes.estimated_amount_in;
  const amountLimit = adjustForSlippage(new BN(toAmount), slippage, !byAmountIn);

  const swapTx = await sdk.Swap.createSwapPayload({
    pool_id: pool.id,
    coin_type_a: pool.coin_type_a,
    coin_type_b: pool.coin_type_b,
    a2b,
    by_amount_in: byAmountIn,
    amount: preSwapRes.amount.toString(),
    amount_limit: amountLimit.toString(),
  });

  const result = await client.signAndExecuteTransaction({
    signer: operatorKeypair,
    transaction: swapTx,
  });

  return result;
}

export async function executeAgentAction(decision: AgentActionDecision) {
  const client = new SuiGrpcClient({
    baseUrl: FULLNODE_BASE_URL,
    network: NETWORK,
  });
  const operatorKeypair = Ed25519Keypair.fromSecretKey(
    decodeSuiPrivateKey(OPERATOR_PRIVATE_KEY).secretKey,
  );

  const policyResult = await runPolicyCheck(client, operatorKeypair, decision);
  // TODO: check policyResult effects/events for ActionFlagged vs
  // ActionExecuted before proceeding, if flagged, don't swap.
  const swapResult = await runCetusSwap(client, operatorKeypair, decision);

  return { policyResult, swapResult };
}
