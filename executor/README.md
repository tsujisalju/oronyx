# Oronyx — Executor

TypeScript service responsible for constructing and submitting Sui
transactions on behalf of an agent. This is the only part of Oronyx that
signs and submits on-chain transactions — `agent-service` (Python) decides
_what_ an agent should do; this service decides _how_ to actually do it
on-chain and executes it.

## Role in the architecture

`agent-service` outputs a decision: an action type, a target, an amount, and
a computed risk score. This service takes that decision and:

1. Builds a Sui transaction calling `oronyx::capability::execute_action_and_transfer_to_operator`,
   signed with the **operator keypair** — a real Sui keypair this service
   controls, distinct from any user's wallet. The contract checks this
   signer against the `AgentCap`'s `operator` field.
2. If the action isn't flagged, the contract releases a `Coin<SUI>` to the
   operator's own address.
3. Separately, runs whatever follow-up action was actually intended (e.g. a
   Cetus swap) against the operator's now-updated balance.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # runs src/executeAgentAction.ts via tsx
```

Required environment variables:

| Variable              | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `ORONYX_PACKAGE_ID`   | Published package ID from `sui move publish` (see `/move/README.md`) |
| `ORONYX_OPERATOR_KEY` | Operator's private key, `suiprivkey1...` format                      |
| `ORONYX_FULLNODE_URL` | Optional override; defaults to Sui testnet fullnode                  |

## Why this is two transactions, not one atomic PTB

The original design assumed `execute_action`'s released `Coin<SUI>` could be
chained directly into a Cetus swap `moveCall` within a single Programmable
Transaction Block. Checking Cetus's actual installed SDK type definitions
(`@cetusprotocol/sui-clmm-sdk`) showed this isn't supported:
`createSwapPayload` and `createSwapWithoutTransferCoinsPayload` are both
`async` and always construct their own `Transaction` internally, with no
parameter accepting an existing transaction or a specific input coin. Cetus
selects input coins itself from whatever the signer address owns on-chain
at build time.

Given that, the integration is deliberately split into two transactions:

1. **Policy check** (`runPolicyCheck` in `executeAgentAction.ts`) — calls
   `execute_action_and_transfer_to_operator`, releasing funds to the
   operator's address if approved.
2. **DeFi action** (`runCetusSwap`) — an ordinary Cetus swap using the
   SDK's normal coin selection, which picks up the coin that just landed in
   the operator's balance.

**This is not atomic.** If step 2 fails after step 1 succeeds, funds sit in
the operator's wallet rather than being returned to the vault. There is
currently no automatic reconciliation for this case — treat it as a known
limitation, not a bug, and consider a manual refund path or retry logic if
time allows. Before proceeding past step 1 in a real flow, check
`policyResult` for an `ActionFlagged` vs. `ActionExecuted` event and stop if
the action was flagged rather than approved.

## Files

- `executeAgentAction.ts` — the real entry point: policy check, then Cetus
  swap, as two sequential transactions.
- `testPolicyCheck.ts` — isolated smoke test for the policy-check
  transaction alone, with no Cetus dependency. Useful for verifying the
  contract-side logic works on live testnet independent of DeFi
  integration issues.
- `testCetusSwap.ts` — isolated smoke test for the Cetus SDK alone, with no
  dependency on `capability.move`. Discovers a real testnet pool via
  `getPoolsWithPage()` rather than a hardcoded address, since pool
  addresses can be stale or wrong across SDK/network versions.

## Current status and open items

- Policy-check transaction (`execute_action_and_transfer_to_operator`) is
  confirmed working end-to-end on live testnet: correct event emission,
  correct coin release, and per-transaction/per-period limit enforcement
  all match unit-test behavior under real network conditions.
- Cetus swap integration is implemented but **not yet verified with a
  funded pool**. The first pool discovered via `getPoolsWithPage()` used
  obscure test tokens (`LOQUA_TEST_COIN` / `LOQUA_TEST_USDC`) with no
  obvious faucet. Next step is filtering pool discovery for a pool paired
  with plain testnet `SUI` (fundable via the standard faucet), or falling
  back to a self-controlled mock-DEX Move module if no such pool has
  workable liquidity.
- `agent-service` integration is not yet wired — `AgentActionDecision`
  (the interface this service expects) should be treated as the contract
  boundary between the two services.
