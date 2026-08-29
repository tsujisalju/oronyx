module oronyx::capability;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::clock::Clock;
use sui::vec_set::{Self, VecSet};
use sui::event;
use sui_system::sui_system::{Self, SuiSystemState};
use oronyx::mock_dex::{Self, MockPool};
use oronyx::mock_usdc::MOCK_USDC;

/* Errors */
const EInactive: u64 = 0;
const EExpired: u64 = 1;
const EActionNotAllowed: u64 = 2;
const ETargetNotAllowed: u64 = 3;
const EOverTxLimit: u64 = 4;
const EOverPeriodLimit: u64 = 5;
const ENotOwner: u64 = 6;
const ENotOperator: u64 = 7;
const EWrongVault: u64 = 8;
const EWrongCap: u64 = 9;

/* Action type codes */
const ACTION_TRANSFER: u8 = 0;
const ACTION_MOCK_SWAP: u8 = 1;
const ACTION_STAKE: u8 = 2;
const ACTION_CETUS_SWAP: u8 = 3;

/* Structs */

/// Shared object that holds the user's funds.
/// The vault does not enforce the policy.
/// All policy checks live on AgentCap
public struct Vault has key {
    id: UID,
    owner: address,
    balance: Balance<SUI>,
}

/// Shared capability object describing the user-defined policy for one agent.
/// Access is enforced via owner and operator fields instead of Sui's
/// object-ownership system since the backend operator must be able to reference
/// this object without the user co-signing every transaction
public struct AgentCap has key {
    id: UID,
    vault_id: ID,
    owner: address,
    operator: address,
    spending_limit_per_tx: u64,
    spending_limit_period: u64,
    period_spent: u64,
    period_start_ms: u64,
    period_length_ms: u64,
    allowed_actions: VecSet<u8>,
    allowed_targets: VecSet<address>,
    risk_threshold: u8,
    expiry_ms: u64,
    active: bool,
}


/// User-owned object representing an action flagged for manual review.
/// Owned by the user so approve/reject can rely on Sui's ownership check
/// rather than manual assert
public struct PendingAction has key {
    id: UID,
    cap_id: ID,
    vault_id: ID,
    action_type: u8,
    target: address,
    amount: u64, // amount is in MIST (1 SUI = 10^9 MIST)
    risk_score: u8,
    created_at_ms: u64
}

/* Events */

public struct CapCreated has copy, drop {
    cap_id: ID,
    vault_id: ID,
    owner: address,
    operator: address,
}

public struct ActionExecuted has copy, drop {
    cap_id: ID,
    action_type: u8,
    target: address,
    amount: u64,
    risk_score: u8,
}

public struct ActionFlagged has copy, drop {
    cap_id: ID,
    pending_id: ID,
    action_type: u8,
    target: address,
    amount: u64,
    risk_score: u8,
}

public struct PendingApproved has copy, drop {
    pending_id: ID,
    cap_id: ID,
}

public struct PendingRejected has copy, drop {
    pending_id: ID,
    cap_id: ID,
}

public struct CapDeactivated has copy, drop {
    cap_id: ID,
}

/* Vault Functions */

public fun create_vault(ctx: &mut TxContext) {
    let vault = Vault {
        id: object::new(ctx),
        owner: ctx.sender(),
        balance: balance::zero(),
    };
    transfer::share_object(vault);
}

public fun deposit(vault: &mut Vault, payment: Coin<SUI>, ctx: &TxContext) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    coin::put(&mut vault.balance, payment);
}

/* AgentCap Lifecycle */

public fun create_agent_cap(
    vault: &Vault,
    operator: address,
    spending_limit_per_tx: u64,
    spending_limit_period: u64,
    period_length_ms: u64,
    allowed_actions: vector<u8>,
    allowed_targets: vector<address>,
    risk_threshold: u8,
    expiry_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);

    let cap = AgentCap {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        operator,
        spending_limit_per_tx,
        spending_limit_period,
        period_spent: 0,
        period_start_ms: clock.timestamp_ms(),
        period_length_ms,
        allowed_actions: vec_set::from_keys(allowed_actions),
        allowed_targets: vec_set::from_keys(allowed_targets),
        risk_threshold,
        expiry_ms,
        active: true,
    };

    event::emit(CapCreated {
        cap_id: object::id(&cap),
        vault_id: object::id(vault),
        owner: cap.owner,
        operator: cap.operator,
    });
    transfer::share_object(cap);
}

public fun add_allowed_target(
    cap: &mut AgentCap,
    target: address,
    ctx: &TxContext,
) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.allowed_targets.insert(target);
}


public fun remove_allowed_target(
    cap: &mut AgentCap,
    target: address,
    ctx: &TxContext,
) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.allowed_targets.remove(&target);
}

public fun update_spending_limit_per_tx(
    cap: &mut AgentCap,
    spending_limit_per_tx: u64,
    ctx: &TxContext,
) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.spending_limit_per_tx = spending_limit_per_tx;
}

public fun update_spending_limit_period(
    cap: &mut AgentCap,
    spending_limit_period: u64,
    ctx: &TxContext,
) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.spending_limit_period = spending_limit_period;
}

public fun update_period_length_ms(
    cap: &mut AgentCap,
    period_length_ms: u64,
    ctx: &TxContext,
) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.period_length_ms = period_length_ms;
}

public fun update_risk_threshold(
    cap: &mut AgentCap,
    risk_threshold: u8,
    ctx: &TxContext,
) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.risk_threshold = risk_threshold;
}

public fun update_expiry_ms(
    cap: &mut AgentCap,
    expiry_ms: u64,
    ctx: &TxContext,
) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.expiry_ms = expiry_ms;
}

public fun deactivate(cap: &mut AgentCap, ctx: &TxContext) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    cap.active = false;
    event::emit(CapDeactivated { cap_id: object::id(cap) });
}

/* Policy Helpers */

/// Rolls the spending window forward id the current period has elapsed.
/// Must be called before checking `period_spent` against the limit.
fun roll_period_if_needed(cap: &mut AgentCap, now_ms: u64) {
    if (now_ms >= cap.period_start_ms + cap.period_length_ms) {
        cap.period_start_ms = now_ms;
        cap.period_spent = 0;
    }
}

/* Core execution entrypoint */

/// Called by agent backend (signed by operator), never by the user directly.
/// Check against policy on cap, if action is within risk boundary, it executes immediately against vault.
/// If it exceeds risk threshold, set as PendingAction owned by user instead of touching the vault.
public fun execute_action(
    cap: &mut AgentCap,
    vault: &mut Vault,
    action_type: u8,
    target: address,
    amount: u64, // amount is in MIST (1 SUI = 10^9 MIST)
    risk_score: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): Option<Coin<SUI>> {
    assert!(cap.operator == ctx.sender(), ENotOperator);
    assert!(cap.vault_id == object::id(vault), EWrongVault);
    assert!(cap.active, EInactive);

    let now_ms = clock.timestamp_ms();
    assert!(now_ms < cap.expiry_ms, EExpired);
    assert!(cap.allowed_actions.contains(&action_type), EActionNotAllowed);
    assert!(cap.allowed_targets.contains(&target), ETargetNotAllowed);
    assert!(amount <= cap.spending_limit_per_tx, EOverTxLimit);

    roll_period_if_needed(cap, now_ms);
    assert!(cap.period_spent + amount <= cap.spending_limit_period, EOverPeriodLimit);

    if (risk_score > cap.risk_threshold) {
        let pending = PendingAction {
            id: object::new(ctx),
            cap_id: object::id(cap),
            vault_id: cap.vault_id,
            action_type,
            target,
            amount,
            risk_score,
            created_at_ms: now_ms,
        };
        event::emit(ActionFlagged {
            cap_id: object::id(cap),
            pending_id: object::id(&pending),
            action_type,
            target,
            amount,
            risk_score,
        });
        transfer::transfer(pending, cap.owner);
        option::none()
    } else {
        cap.period_spent = cap.period_spent + amount;
        let out_coin = coin::take(&mut vault.balance, amount, ctx);
        event::emit(ActionExecuted {
            cap_id: object::id(cap),
            action_type,
            target,
            amount,
            risk_score,
        });
        option::some(out_coin)
    }
}

/// Entry function for Cetus swap, this action type has an external SDK that
/// require a two-step hand-off. Cetus' swap builder always constructs its own tx
/// and selects input coins from the signer's on-chain balance, with no way to
/// accept a specific coin object or an existing transaction to append to.
///
/// Releases the approved coin to `ctx.sender()` (the operator), so the executor's
/// second transaction (an ordinary Cetus swap) can pick it up from the operator's
/// own balance. Not atomic, if the second transaction fails, funds remain with the
/// the operator rather than returning to the vault.
public fun execute_cetus_swap_and_transfer_to_operator(
    cap: &mut AgentCap,
    vault: &mut Vault,
    cetus_pool_address: address,
    amount: u64, // MIST
    risk_score: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let maybe_coin = execute_action(cap, vault, ACTION_CETUS_SWAP, cetus_pool_address, amount, risk_score, clock, ctx);
    if(maybe_coin.is_some()) {
        transfer::public_transfer(maybe_coin.destroy_some(), ctx.sender());
    } else {
        maybe_coin.destroy_none();
    }
}

/* Atomic action types */
// Funds never leave vault custody boundary until they land
// at their real destination, all within one PTB. Each has its
// own entry function because Move does not support optional args,
// so each action type's extra required objects (a MockPool,
// a SuiSystemState, etc.) need their iwn dedicated signature. Only
// actions whose external SDK forces a two-step hand-off (such as Cetus)
// use execute_action_and_tranfer_to_operator instead.

public fun execute_transfer(
    cap: &mut AgentCap,
    vault: &mut Vault,
    recipient: address,
    amount: u64, // MIST
    risk_score: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let maybe_coin = execute_action(cap, vault, ACTION_TRANSFER, recipient, amount, risk_score, clock, ctx);
    if (maybe_coin.is_some()) {
        transfer::public_transfer(maybe_coin.destroy_some(), recipient);
    } else {
        maybe_coin.destroy_none();
    }
}

/// `validator` is both the policy's target (must be in allowed_targets)
/// and the actual validator address staked with.
///
/// Verified against the sui-system framework source:
/// `sui_system::request_add_stake_non_entry` returns a `StakedSui` object
/// (has `key, store`, not `drop`) rather than auto-transferring it, so the
/// result must be explicitly transferred here.
public fun execute_stake(
    cap: &mut AgentCap,
    vault: &mut Vault,
    system_state: &mut SuiSystemState,
    validator: address,
    amount: u64, // MIST
    risk_score: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let maybe_coin = execute_action(cap, vault, ACTION_STAKE, validator, amount, risk_score, clock, ctx);
    if (maybe_coin.is_some()) {
        let staked = sui_system::request_add_stake_non_entry(
            system_state,
            maybe_coin.destroy_some(),
            validator,
            ctx
        );
        transfer::public_transfer(staked, cap.owner);
    } else {
        maybe_coin.destroy_none();
    }
}

/// `pool_address` is both the policy's target (must be in allowed targets list)
/// and the actual `MockPool` object passed in. The caller is responsible for
/// making these consistent; a mismatch here is a caller bug.
public fun execute_mock_swap(
    cap: &mut AgentCap,
    vault: &mut Vault,
    pool: &mut MockPool,
    pool_address: address,
    amount: u64, // MIST
    risk_score: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let maybe_coin = execute_action(cap, vault, ACTION_MOCK_SWAP, pool_address, amount, risk_score, clock, ctx);
    if (maybe_coin.is_some()) {
        let out: Coin<MOCK_USDC> = mock_dex::swap_sui_for_mock_usdc(pool, maybe_coin.destroy_some(), ctx);
        transfer::public_transfer(out, cap.owner);
    } else {
        maybe_coin.destroy_none();
    }
}

/* Approval flow for flagged actions */

public fun approve_pending(
    pending: PendingAction,
    cap: &mut AgentCap,
    vault: &mut Vault,
    ctx: &mut TxContext,
): Coin<SUI> {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    assert!(pending.cap_id == object::id(cap), EWrongCap);
    assert!(pending.vault_id == object::id(vault), EWrongVault);

    let PendingAction { id, cap_id: _, vault_id: _, action_type, target, amount, risk_score, created_at_ms: _ } = pending;

    cap.period_spent = cap.period_spent + amount;
    let out_coin = coin::take(&mut vault.balance, amount, ctx);

    event::emit(PendingApproved { pending_id: object::uid_to_inner(&id), cap_id: object::id(cap) });
    event::emit(ActionExecuted { cap_id: object::id(cap), action_type, target, amount, risk_score });

    object::delete(id);
    out_coin
}


public fun reject_pending(pending: PendingAction, cap: &AgentCap, ctx: &TxContext) {
    assert!(cap.owner == ctx.sender(), ENotOwner);
    assert!(pending.cap_id == object::id(cap), EWrongCap);

    let PendingAction { id, cap_id, .. } = pending;
    event::emit(PendingRejected { pending_id: object::uid_to_inner(&id), cap_id });
    object::delete(id);
}
