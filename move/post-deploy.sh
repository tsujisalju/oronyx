#!/bin/sh
sui client call --package <PACKAGE_ID> --module capability --function create_vault --gas-budget 10000000
# note the resulting Vault object ID from the output, then:

use sui client ptb --split-coins gas "[<AMOUNT>]" --assign coin --transfer-objects "[coin]" @<RECIPIENT_ADDR>
# get the Coin object ID in sui client gas, then:
#
sui client call --package <PACKAGE_ID> --module capability --function deposit \
  --args <VAULT_ID> <COIN_OBJECT_ID> --gas-budget 10000000

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
    "[0x46a1faf924579b2265c6594d87061805a969e7d027cb8f6002a4cb22111d71b2]" \ # TARGET_ADDR
    50 \ # RISK_THRESHOLD
    1798761600000 \ # EXPIRY_MS
    0x6 \ # CLOCK_ID
    --gas-budget 10000000
