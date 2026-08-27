import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import CetusClmmSDK from "@cetusprotocol/sui-clmm-sdk";
import { Percentage, adjustForSlippage, d } from "@cetusprotocol/common-sdk";

// === Config — move to env vars before this leaves a dev machine ===
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

/**
 * Builds and submits a PTB that:
 *  1. calls oronyx::capability::execute_action, checking the policy and
 *     splitting `amountMist` off the vault as a Coin<SUI> (or parking a
 *     PendingAction and returning none if flagged)
 *  2. runs a Cetus swap in the SAME transaction using
 *     `createSwapWithoutTransferCoinsPayload`, which returns the swap's
 *     output coins instead of auto-transferring them, so they can be
 *     merged into the same PTB rather than a separate transaction.
 *
 * Signed by the operator keypair, not the user — this is the backend's
 * own on-chain identity, matching AgentCap.operator.
 *
 * OPEN QUESTION — NOT YET VERIFIED:
 * Cetus's documented swap examples always show the SDK choosing its own
 * input coins (merged from the signer's owned coins) rather than
 * accepting a specific Coin<SUI> object you hand it. Our design assumes
 * the coin `execute_action` releases can be threaded in as the swap's
 * input. Before relying on this:
 *   - Inspect the TS type signature of `createSwapWithoutTransferCoinsPayload`
 *     for an input-coin argument (it may exist even if not shown in the
 *     docs example above).
 *   - If no such argument exists, the fallback is: let Cetus's builder
 *     select/merge coins as it normally would (from the operator's own
 *     gas/owned coins), and treat `execute_action`'s released coin as
 *     something the operator deposits back into their own holdings or
 *     merges manually beforehand — i.e. policy-check and swap become two
 *     linked but not strictly fund-chained calls in the same PTB. This
 *     still gives you atomicity (both succeed or both fail) even if the
 *     exact coin object isn't threaded through.
 *   - Confirm this against a real testnet call before the demo — do not
 *     assume the composed version below is correct as written.
 */
export async function executeAgentAction(decision: AgentActionDecision) {
  const client = new SuiGrpcClient({
    baseUrl: FULLNODE_BASE_URL,
    network: NETWORK,
  });
  const operatorKeypair = Ed25519Keypair.fromSecretKey(
    decodeSuiPrivateKey(OPERATOR_PRIVATE_KEY).secretKey,
  );
  const operatorAddress = operatorKeypair.getPublicKey().toSuiAddress();

  const sdk = CetusClmmSDK.createSDK({ env: NETWORK });

  // --- Pre-swap estimate (required by Cetus before building the real payload) ---
  const pool = await sdk.Pool.getPool(decision.poolId);
  const a2b = true; // adjust per actual swap direction for this decision
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
  const amountLimit = adjustForSlippage(toAmount, slippage, !byAmountIn);

  // --- Step 1: policy check + fund release, on our own Transaction object ---
  const tx = new Transaction();

  // NOTE: execute_action returns Option<Coin<SUI>>. Unwrapping an Option
  // mid-PTB from the TS side is not always ergonomic — you likely want a
  // small accompanying Move function (e.g. `unwrap_action_coin`) that
  // takes the Option and either aborts or returns the inner Coin<SUI>, so
  // the executor calls that explicitly as its own moveCall rather than
  // trying to manipulate an Option object directly here. Not yet added to
  // capability.move — flagging as a follow-up before this runs for real.
  const [maybeCoin] = tx.moveCall({
    target: `${PACKAGE_ID}::capability::execute_action`,
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

  // --- Step 2: Cetus swap payload ---
  // `createSwapWithoutTransferCoinsPayload` returns the output coins
  // instead of transferring them automatically, per Cetus's docs — this
  // is the variant that supports further PTB composition.
  const swapPayload = await sdk.Swap.createSwapWithoutTransferCoinsPayload({
    pool_id: pool.id,
    coin_type_a: pool.coin_type_a,
    coin_type_b: pool.coin_type_b,
    a2b,
    by_amount_in: byAmountIn,
    amount: preSwapRes.amount.toString(),
    amount_limit: amountLimit.toString(),
  });

  const { tx: swapTx, coin_ab_s: outputCoins } = swapPayload;

  // CRITICAL UNVERIFIED POINT: confirm whether `swapPayload.tx` is the
  // SAME Transaction instance as `tx` above (meaning Cetus accepted and
  // appended to it) or a NEW Transaction Cetus created internally. The
  // docs example doesn't pass an existing `tx` into
  // `createSwapWithoutTransferCoinsPayload`, which suggests it likely
  // builds its own. If so, our execute_action call and the swap are
  // currently NOT in the same PTB despite the comments above — check
  // `swapTx === tx` at runtime, or check the SDK's TS types for a
  // `tx`/`transaction` input parameter on this method, before assuming
  // atomicity. This is exactly what the standalone test should confirm.
  swapTx.transferObjects(outputCoins, swapTx.pure.address(operatorAddress));

  // --- Submit ---
  const result = await client.signAndExecuteTransaction({
    signer: operatorKeypair,
    transaction: swapTx,
  });

  return result;
}
