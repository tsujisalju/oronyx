# Oronyx — Move Contract

Sui Move package implementing scoped, policy-enforced agent wallets. This is
the on-chain trust layer for Oronyx: it defines what an autonomous agent is
allowed to do with a user's funds, and enforces that boundary at the
transaction level rather than relying on off-chain promises.

## Concepts

**Vault** — a shared object holding a user's deposited `SUI` balance. The
vault itself has no policy logic; it only tracks ownership and balance.

**AgentCap** — a shared object encoding one agent's authorization: which
actions it may perform, on which targets, up to what spending limits, until
what expiry, and above what risk score an action must be flagged for manual
review instead of auto-executed.

**PendingAction** — a user-owned object representing an action that exceeded
the agent's risk threshold. Created automatically by `execute_action`;
resolved later by the user calling `approve_pending` or `reject_pending`.

## Why shared objects, not owned objects

`AgentCap` is a shared object rather than being owned by the user's address.
This was a deliberate design correction: an address-owned object can only be
referenced by a transaction that address itself signs. Since the whole point
of an agent is to act without the user co-signing every transaction, the cap
has to be shared — access control is enforced by explicit `assert!` checks
against `owner` and `operator` fields instead of Sui's object-ownership
system.

- `owner` — the user. Can deactivate the cap, approve or reject a
  `PendingAction`.
- `operator` — the backend's own address (see `/executor`). The only address
  allowed to call `execute_action`.

`PendingAction`, by contrast, genuinely is user-owned — approval/rejection is
naturally gated by Sui's ownership model, so no extra authorization field is
needed there.

## Core flow

`execute_action` is the single entrypoint the operator calls to attempt an
action:

1. Checks `active`, `expiry_ms`, `allowed_actions`, `allowed_targets`,
   `spending_limit_per_tx`, and the rolling `spending_limit_period` window.
2. If `risk_score <= risk_threshold`: splits `amount` off the vault's balance
   and returns it as `Option<Coin<SUI>>` (`some`), for the caller to use
   however it needs (e.g. as input to a follow-up DeFi transaction).
3. If `risk_score > risk_threshold`: no funds move. A `PendingAction` is
   created and transferred to the owner. Returns `option::none()`.

`execute_action_and_transfer_to_operator` is a convenience wrapper around the
above for callers that don't want to unwrap the `Option` themselves — on the
happy path it transfers the released coin directly to `ctx.sender()` (the
operator).

`approve_pending` / `reject_pending` resolve a flagged action. Approval
releases the originally-requested amount from the vault; rejection simply
deletes the pending object with no funds moved.

## Error codes

| Code | Constant            | Meaning                                                      |
| ---- | ------------------- | ------------------------------------------------------------ |
| 0    | `EInactive`         | Cap has been deactivated by the owner                        |
| 1    | `EExpired`          | Past `expiry_ms`                                             |
| 2    | `EActionNotAllowed` | `action_type` not in `allowed_actions`                       |
| 3    | `ETargetNotAllowed` | `target` not in `allowed_targets`                            |
| 4    | `EOverTxLimit`      | `amount` exceeds `spending_limit_per_tx`                     |
| 5    | `EOverPeriodLimit`  | Cumulative spend this period exceeds `spending_limit_period` |
| 6    | `ENotOwner`         | Caller is not `cap.owner`                                    |
| 7    | `ENotOperator`      | Caller is not `cap.operator`                                 |
| 8    | `EWrongVault`       | Vault passed doesn't match `cap.vault_id`                    |
| 9    | `EWrongCap`         | `PendingAction` doesn't belong to the cap passed in          |

## Building and testing

```bash
sui move build
sui move test
```

Tests live in `tests/capability_tests.move` and use `sui::test_scenario` to
simulate multi-transaction flows (owner setup, operator execution, owner
approval), plus `sui::clock` test helpers to exercise the period-rollover
logic. Coverage includes the happy path, both pending-action resolutions,
every authorization/policy abort, and period rollover.

Error and action-type constants in the test module are manually mirrored
from `capability.move`, since the source module doesn't expose them as
`public`. If a constant's value changes in the contract, update the mirrored
copy in the test module to match.

## Deployment (testnet)

```bash
sui client switch --env testnet
sui client publish --gas-budget 200000000
```

Record the resulting package ID from the publish output (also saved to
`Published.toml` under `[published.testnet]`). Post-publish setup —
creating a vault, depositing funds, and creating an agent cap — is not part
of `publish`; see `post-deploy.sh` for the sequence of `sui client call`
commands, and fill in the placeholder values (`<PACKAGE_ID>`, `<VAULT_ID>`,
`<OPERATOR_ADDR>`, target address, expiry timestamp) for your own run.

The `create_agent_cap` call takes a shared `Clock` object as input — always
`0x6` on any Sui network.

## Known limitations / open items

- **Balance movement is generic**, not yet wired to a specific external
  protocol call within the same transaction. See `/executor`'s README for
  how DeFi integration (Cetus) is composed instead, and why it's currently
  two separate transactions rather than one atomic PTB.
- **Period rollover is a simple reset-on-boundary counter**, not a true
  rolling window. Acceptable for the current scope; a sliding window would
  need additional state if more precision is ever required.
