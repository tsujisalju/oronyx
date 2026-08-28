#!/bin/sh
# after deploying to testnet, note the package ID, then:

# 1. Create the vault
sui client call --package <PACKAGE_ID> --module capability --function create_vault --gas-budget 10000000
# note the resulting Vault object ID and Treasury Cap ID from the output, then:

# 2. Split SUI coins to fund vault
use sui client ptb --split-coins gas "[<AMOUNT>]" --assign coin --transfer-objects "[coin]" @<RECIPIENT_ADDR>
# get the Coin object ID in `sui client gas`, then:

# 3. Deposit funds to vault
sui client call --package <PACKAGE_ID> --module capability --function deposit \
  --args <VAULT_ID> <COIN_OBJECT_ID> --gas-budget 10000000

# 4. Mint Mock USDC
sui client ptb --move-call <PACKAGE_ID>::mock_usdc::mint_mock_usdc @<TREASURY_CAP_ID> 1000000000000 --assign minted --transfer-objects [minted] @<RECIPIENT_ADDR>
# get the Coin object ID in `sui client objects`, then:

# 5. Split SUI coins to fund pool
sui client ptb --split-coins gas "[<AMOUNT>]" --assign coin --transfer-objects "[coin]" @<RECIPIENT_ADDR>
# get the Coin object ID in `sui client gas`, then:

# 6. Create Mock SUI/USDC Pool
sui client ptb --move-call <PACKAGE_ID>::mock_dex::create_pool @<SUI_COIN_OBJECT_ID> @<MOCK_USDC_COIN_OBJECT_ID> 750000 --gas-budget 100000000
# get the mock pool object ID, then:

# 7. Create AgentCap
sui client call --package <PACKAGE_ID> \
    --module capability \
    --function create_agent_cap \
    --args \
    <VAULT_ID> \
    <OPERATOR_ADDR> \
    100000000 \ # TX_LIMIT
    500000000 \ # PERIOD_LIMIT
    86400000 \ # PERIOD_LENGTH_MS
    "[1]" \ # ALLOWED_ACTIONS
    "[<MOCK_POOL_ID>]" \ # ALLOWED_TARGET_ADDR_LIST
    50 \ # RISK_THRESHOLD
    1798761600000 \ # EXPIRY_MS
    0x6 \ # CLOCK_ID
    --gas-budget 10000000
