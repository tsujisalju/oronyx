#[test_only]
module oronyx::capability_tests;

use oronyx::capability::{Self, Vault, AgentCap, PendingAction};
use oronyx::mock_dex::{Self, MockPool};
use oronyx::mock_usdc::MOCK_USDC;
use sui::test_scenario as ts;
use sui::coin;
use sui::sui::SUI;
use sui::clock;
use std::unit_test::{assert_eq, destroy};

// Mirrors capability.move's private error constants — kept in sync manually
// since the source module doesn't expose them.
const EInactive: u64 = 0;
const ETargetNotAllowed: u64 = 3;
const EOverTxLimit: u64 = 4;
const EOverPeriodLimit: u64 = 5;
const ENotOwner: u64 = 6;
const ENotOperator: u64 = 7;

// Mirrors capability.move's private action-type codes.
const ACTION_TRANSFER: u8 = 0;
const ACTION_SWAP: u8 = 1; // == ACTION_MOCK_SWAP, same underlying value
const ACTION_CETUS_SWAP: u8 = 3;

const OWNER: address = @0xA;
const OPERATOR: address = @0xB;
const ATTACKER: address = @0xC;
const TARGET: address = @0xD;

const DEPOSIT_AMOUNT: u64 = 1_000_000;
const TX_LIMIT: u64 = 100_000;
const PERIOD_LIMIT: u64 = 300_000;
const PERIOD_LENGTH_MS: u64 = 86_400_000; // 1 day
const RISK_THRESHOLD: u8 = 50;
const EXPIRY_MS: u64 = 999_999_999_999;

/// Shared setup: owner creates + funds a vault, then creates an AgentCap
/// authorizing `OPERATOR` to run ACTION_SWAP and ACTION_CETUS_SWAP against
/// `TARGET`, up to
/// TX_LIMIT per call and PERIOD_LIMIT per period.
fun setup(scenario: &mut ts::Scenario) {
    let clock = clock::create_for_testing(scenario.ctx());

    capability::create_vault(scenario.ctx());
    scenario.next_tx(OWNER);

    let mut vault = scenario.take_shared<Vault>();
    let funding = coin::mint_for_testing<SUI>(DEPOSIT_AMOUNT, scenario.ctx());
    capability::deposit(&mut vault, funding, scenario.ctx());

    capability::create_agent_cap(
        &vault,
        OPERATOR,
        TX_LIMIT,
        PERIOD_LIMIT,
        PERIOD_LENGTH_MS,
        vector[ACTION_TRANSFER, ACTION_SWAP, ACTION_CETUS_SWAP],
        vector[TARGET],
        RISK_THRESHOLD,
        EXPIRY_MS,
        &clock,
        scenario.ctx(),
    );

    ts::return_shared(vault);
    clock.destroy_for_testing();
}

#[test]
fun low_risk_action_releases_coin_to_operator() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    capability::execute_cetus_swap_and_transfer_to_operator(
        &mut cap,
        &mut vault,
        TARGET,
        50_000,
        RISK_THRESHOLD, // == threshold, not > threshold, so this stays low-risk
        &clock,
        scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();

    scenario.next_tx(OPERATOR);
    let released = scenario.take_from_sender<coin::Coin<SUI>>();
    assert_eq!(released.value(), 50_000);
    destroy(released);

    scenario.end();
}

#[test]
fun high_risk_action_is_flagged_and_approve_pending_releases_funds() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    let maybe_coin = capability::execute_action(
        &mut cap,
        &mut vault,
        ACTION_SWAP,
        TARGET,
        50_000,
        RISK_THRESHOLD + 1, // above threshold -> flagged, no funds move
        &clock,
        scenario.ctx(),
    );
    assert!(maybe_coin.is_none());
    maybe_coin.destroy_none();

    ts::return_shared(cap);
    clock.destroy_for_testing();

    // Pending action was sent to the owner, not the operator.
    scenario.next_tx(OWNER);
    assert!(scenario.has_most_recent_for_sender<PendingAction>());
    let pending = scenario.take_from_sender<PendingAction>();
    let mut cap = scenario.take_shared<AgentCap>();

    let released = capability::approve_pending(pending, &mut cap, &mut vault, scenario.ctx());
    assert_eq!(released.value(), 50_000);
    destroy(released);

    ts::return_shared(vault);
    ts::return_shared(cap);
    scenario.end();
}

#[test]
fun high_risk_action_reject_pending_deletes_it_without_moving_funds() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    let maybe_coin = capability::execute_action(
        &mut cap,
        &mut vault,
        ACTION_SWAP,
        TARGET,
        50_000,
        RISK_THRESHOLD + 1,
        &clock,
        scenario.ctx(),
    );
    maybe_coin.destroy_none();
    ts::return_shared(cap);
    clock.destroy_for_testing();

    scenario.next_tx(OWNER);
    let pending = scenario.take_from_sender<PendingAction>();
    let cap = scenario.take_shared<AgentCap>();

    capability::reject_pending(pending, &cap, scenario.ctx());

    ts::return_shared(vault);
    ts::return_shared(cap);
    scenario.end();
}

#[test, expected_failure(abort_code = ENotOperator, location = capability)]
fun non_operator_cannot_execute_action() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(ATTACKER);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    capability::execute_cetus_swap_and_transfer_to_operator(
        &mut cap, &mut vault, TARGET, 50_000, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();
    scenario.end();
}

#[test, expected_failure(abort_code = EInactive, location = capability)]
fun deactivated_cap_rejects_execute_action() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    let mut cap = scenario.take_shared<AgentCap>();
    capability::deactivate(&mut cap, scenario.ctx());
    ts::return_shared(cap);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    capability::execute_cetus_swap_and_transfer_to_operator(
        &mut cap, &mut vault, TARGET, 50_000, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();
    scenario.end();
}

#[test, expected_failure(abort_code = ETargetNotAllowed, location = capability)]
fun disallowed_target_aborts() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    capability::execute_cetus_swap_and_transfer_to_operator(
        &mut cap, &mut vault, @0xBAD, 50_000, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();
    scenario.end();
}

#[test, expected_failure(abort_code = EOverTxLimit, location = capability)]
fun over_per_tx_limit_aborts() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    capability::execute_cetus_swap_and_transfer_to_operator(
        &mut cap, &mut vault, TARGET, TX_LIMIT + 1, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();
    scenario.end();
}

#[test, expected_failure(abort_code = EOverPeriodLimit, location = capability)]
fun over_period_limit_aborts_within_same_period() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    // Three calls at TX_LIMIT each would total 300_000 == PERIOD_LIMIT
    // exactly; push it over with a fourth within the same period.
    let mut i: u64 = 0;
    while (i < 3) {
        capability::execute_cetus_swap_and_transfer_to_operator(
            &mut cap, &mut vault, TARGET, TX_LIMIT, RISK_THRESHOLD, &clock, scenario.ctx(),
        );
        i = i + 1;
    };
    capability::execute_cetus_swap_and_transfer_to_operator(
        &mut cap, &mut vault, TARGET, TX_LIMIT, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();
    scenario.end();
}

#[test]
fun period_rolls_over_after_period_length_elapses() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let mut clock = clock::create_for_testing(scenario.ctx());

    // Spend right up to the period limit, in TX_LIMIT-sized chunks (a
    // single PERIOD_LIMIT-sized call would exceed the per-tx limit).
    let mut i: u64 = 0;
    while (i < 3) {
        capability::execute_cetus_swap_and_transfer_to_operator(
            &mut cap, &mut vault, TARGET, TX_LIMIT, RISK_THRESHOLD, &clock, scenario.ctx(),
        );
        i = i + 1;
    };

    // Advance the clock past the period boundary — spend should reset,
    // so this next call (which would otherwise exceed the period limit)
    // succeeds instead of aborting.
    clock.increment_for_testing(PERIOD_LENGTH_MS + 1);
    capability::execute_cetus_swap_and_transfer_to_operator(
        &mut cap, &mut vault, TARGET, TX_LIMIT, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();
    scenario.end();
}

#[test, expected_failure(abort_code = ENotOwner, location = capability)]
fun non_owner_cannot_deactivate_cap() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(ATTACKER);
    let mut cap = scenario.take_shared<AgentCap>();
    capability::deactivate(&mut cap, scenario.ctx());

    ts::return_shared(cap);
    scenario.end();
}

#[test, expected_failure(abort_code = ENotOwner, location = capability)]
fun non_owner_cannot_approve_pending() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    let maybe_coin = capability::execute_action(
        &mut cap, &mut vault, ACTION_SWAP, TARGET, 50_000, RISK_THRESHOLD + 1, &clock, scenario.ctx(),
    );
    maybe_coin.destroy_none();
    ts::return_shared(cap);
    clock.destroy_for_testing();

    scenario.next_tx(OWNER);
    let pending = scenario.take_from_sender<PendingAction>();

    scenario.next_tx(ATTACKER);
    let mut cap = scenario.take_shared<AgentCap>();
    let released = capability::approve_pending(pending, &mut cap, &mut vault, scenario.ctx());
    destroy(released);

    ts::return_shared(vault);
    ts::return_shared(cap);
    scenario.end();
}

/* execute_transfer — atomic native SUI transfer */

#[test]
fun execute_transfer_sends_coin_to_recipient() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    capability::execute_transfer(
        &mut cap, &mut vault, TARGET, 50_000, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();

    // Coin should land directly at the recipient (TARGET), not the
    // operator — this is the point of the atomic path versus the
    // release-to-operator pattern used for Cetus.
    scenario.next_tx(TARGET);
    let received = scenario.take_from_sender<coin::Coin<SUI>>();
    assert_eq!(received.value(), 50_000);
    destroy(received);

    scenario.end();
}

#[test, expected_failure(abort_code = ETargetNotAllowed, location = capability)]
fun execute_transfer_to_disallowed_recipient_aborts() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();
    let clock = clock::create_for_testing(scenario.ctx());

    capability::execute_transfer(
        &mut cap, &mut vault, @0xBAD, 50_000, RISK_THRESHOLD, &clock, scenario.ctx(),
    );
    ts::return_shared(vault);
    ts::return_shared(cap);
    clock.destroy_for_testing();
    scenario.end();
}

/* execute_mock_swap — atomic swap against oronyx::mock_dex::MockPool */

const MOCK_RATE_USDC_PER_SUI: u64 = 950_000;

/// This test can't reuse the shared `setup()` helper, since the mock
/// pool's object address isn't known until after it's created, and
/// `allowed_targets` needs to be set at cap-creation time to include it.
#[test]
fun execute_mock_swap_delivers_mock_usdc_to_owner() {
    let mut scenario = ts::begin(OWNER);
    let clock = clock::create_for_testing(scenario.ctx());

    capability::create_vault(scenario.ctx());
    scenario.next_tx(OWNER);
    let mut vault = scenario.take_shared<Vault>();
    let funding = coin::mint_for_testing<SUI>(DEPOSIT_AMOUNT, scenario.ctx());
    capability::deposit(&mut vault, funding, scenario.ctx());

    let pool_sui = coin::mint_for_testing<SUI>(10_000_000_000, scenario.ctx());
    let pool_usdc = coin::mint_for_testing<MOCK_USDC>(9_500_000_000, scenario.ctx());
    mock_dex::create_pool(pool_sui, pool_usdc, MOCK_RATE_USDC_PER_SUI, scenario.ctx());
    scenario.next_tx(OWNER);
    let mut pool = scenario.take_shared<MockPool>();
    let pool_address = object::id(&pool).to_address();

    capability::create_agent_cap(
        &vault,
        OPERATOR,
        TX_LIMIT,
        PERIOD_LIMIT,
        PERIOD_LENGTH_MS,
        vector[ACTION_SWAP], // == ACTION_MOCK_SWAP
        vector[pool_address],
        RISK_THRESHOLD,
        EXPIRY_MS,
        &clock,
        scenario.ctx(),
    );
    ts::return_shared(vault);

    scenario.next_tx(OPERATOR);
    let mut vault = scenario.take_shared<Vault>();
    let mut cap = scenario.take_shared<AgentCap>();

    capability::execute_mock_swap(
        &mut cap, &mut vault, &mut pool, pool_address, 50_000, RISK_THRESHOLD, &clock, scenario.ctx(),
    );

    ts::return_shared(vault);
    ts::return_shared(cap);
    ts::return_shared(pool);
    clock.destroy_for_testing();

    // Output goes to the owner, not the operator — matches execute_stake's
    // pattern of delivering the resulting position/asset to the user.
    scenario.next_tx(OWNER);
    let received = scenario.take_from_sender<coin::Coin<MOCK_USDC>>();
    // 50_000 * rate(950_000) / 1e9, per mock_dex's fixed-rate formula.
    assert_eq!(received.value(), 47);
    destroy(received);

    scenario.end();
}

/* execute_stake — NOT YET COVERED.
 *
 * Unlike Vault/AgentCap/MockPool, `SuiSystemState` isn't something this
 * test module can construct directly with `object::new` — it requires
 * Sui's own test scaffolding for spinning up a fake validator set
 * (likely something under a module like sui_system::governance_test_utils,
 * based on how Sui's own framework tests exercise staking, though the
 * exact function name/signature was not verified against your framework
 * checkout in this session). Confirm the correct test-utility entrypoint
 * before writing this test — do not assume the above module path is
 * correct without checking it directly against your dependency source.
 */
