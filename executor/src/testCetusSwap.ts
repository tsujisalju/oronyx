import "dotenv/config";
import CetusClmmSDK from "@cetusprotocol/sui-clmm-sdk";
import { Percentage, adjustForSlippage, d } from "@cetusprotocol/common-sdk";
import BN from "bn.js";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

/**
 * Standalone test: proves the Cetus testnet SDK works end-to-end,
 * completely isolated from capability.move / the vault / AgentCap.
 * Run with a funded testnet keypair (get SUI from the testnet faucet).
 *
 * Usage:
 *   ORONYX_OPERATOR_KEY=suiprivkey1... npm run dev -- src/testCetusSwap.ts
 * (or add a "test:cetus": "tsx src/testCetusSwap.ts" script)
 */

const OPERATOR_PRIVATE_KEY = process.env.ORONYX_OPERATOR_KEY!;
const FULLNODE_BASE_URL =
  process.env.ORONYX_FULLNODE_URL ?? "https://fullnode.testnet.sui.io:443";
const NETWORK = "testnet" as const;

async function main() {
  if (!OPERATOR_PRIVATE_KEY) {
    throw new Error(
      "Set ORONYX_OPERATOR_KEY to a funded testnet keypair (suiprivkey1...) first.",
    );
  }

  const client = new SuiGrpcClient({
    baseUrl: FULLNODE_BASE_URL,
    network: NETWORK,
  });
  const keypair = Ed25519Keypair.fromSecretKey(
    decodeSuiPrivateKey(OPERATOR_PRIVATE_KEY).secretKey,
  );
  const address = keypair.getPublicKey().toSuiAddress();
  console.log("Testing as:", address);

  const sdk = CetusClmmSDK.createSDK({ env: NETWORK });
  const wallet = process.env.ORONYX_OPERATOR_ADDR!;
  sdk.setSenderAddress(wallet);

  // --- Discover a real testnet pool instead of hardcoding an address ---
  const poolsPage = await sdk.Pool.getPoolsWithPage();
  const pools = poolsPage.data ?? [];
  if (pools.length === 0) {
    throw new Error(
      "No pools returned — testnet indexer may be empty/down; check Cetus's status.",
    );
  }

  // Prefer a pool that actually has liquidity so the swap doesn't fail on
  // an empty/abandoned test pool.
  const candidate = pools.find((p) => p.liquidity > 0) ?? pools[0];
  console.log("Using pool:", candidate.id, {
    coin_type_a: candidate.coin_type_a,
    coin_type_b: candidate.coin_type_b,
  });

  const pool = await sdk.Pool.getPool(candidate.id);

  // Small, safe test amount — adjust decimals per the pool's actual coins.
  const a2b = true;
  const byAmountIn = true;
  const testAmount = "1000000"; // 0.001 of coin A's smallest unit, adjust as needed

  const preSwapRes: any = await sdk.Swap.preSwap({
    pool,
    current_sqrt_price: pool.current_sqrt_price,
    coin_type_a: pool.coin_type_a,
    coin_type_b: pool.coin_type_b,
    decimals_a: 9, // VERIFY against the actual coin metadata for this pool
    decimals_b: 6, // VERIFY against the actual coin metadata for this pool
    a2b,
    by_amount_in: byAmountIn,
    amount: testAmount,
  });
  console.log("preSwap result:", preSwapRes);

  const slippage = Percentage.fromDecimal(d(5)); // 5% for a test run
  const toAmount = byAmountIn
    ? preSwapRes.estimated_amount_out
    : preSwapRes.estimated_amount_in;
  const amountLimit = adjustForSlippage(
    new BN(toAmount),
    slippage,
    !byAmountIn,
  );

  const swapTx = await sdk.Swap.createSwapPayload({
    pool_id: pool.id,
    coin_type_a: pool.coin_type_a,
    coin_type_b: pool.coin_type_b,
    a2b,
    by_amount_in: byAmountIn,
    amount: preSwapRes.amount.toString(),
    amount_limit: amountLimit.toString(),
  });

  console.log("Submitting swap transaction...");
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: swapTx,
  });

  console.log("Swap result:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
