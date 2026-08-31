import { toBase64 } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

import { dAppKit } from "./dapp-kit";
import { enokiClient } from "./enoki";

interface SignAndExecuteSponsoredTransactionArgs {
  transaction: Transaction;
  sender: string;
  allowedMoveCallTargets?: string[];
  allowedAddresses?: string[];
}

/**
 * Builds `transaction`'s kind bytes (no sender/gas), asks Enoki's gas
 * station to wrap them into a fully sponsored transaction, has the
 * connected wallet sign those exact sponsored bytes (not a locally
 * rebuilt transaction — dAppKit.signTransaction is passed the raw bytes
 * string precisely so it can't overwrite the sponsor's gas config), then
 * submits via Enoki. This is the reference path any user-signed
 * transaction in this app should go through instead of a plain
 * dAppKit.signAndExecuteTransaction.
 */
export async function signAndExecuteSponsoredTransaction({
  transaction,
  sender,
  allowedMoveCallTargets,
  allowedAddresses,
}: SignAndExecuteSponsoredTransactionArgs) {
  const network = "testnet" as const;
  const client = dAppKit.getClient(network);

  const transactionKindBytes = await transaction.build({
    onlyTransactionKind: true,
    client,
  });
  const transactionKindBytesBase64 = toBase64(transactionKindBytes);

  const sponsored = await enokiClient.createSponsoredTransaction({
    network,
    transactionKindBytes: transactionKindBytesBase64,
    sender,
    allowedMoveCallTargets,
    allowedAddresses,
  });

  const { signature } = await dAppKit.signTransaction({
    transaction: sponsored.bytes,
  });

  const { digest } = await enokiClient.executeSponsoredTransaction({
    digest: sponsored.digest,
    signature,
  });

  return client.waitForTransaction({
    digest,
    include: { effects: true, objectTypes: true },
  });
}
