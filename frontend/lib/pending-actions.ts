import { Transaction } from "@mysten/sui/transactions";

import { signAndExecuteSponsoredTransaction } from "@/lib/sponsored-transaction";

const PACKAGE_ID = process.env.NEXT_PUBLIC_ORONYX_PACKAGE_ID!;

export async function approvePendingAction({
  pendingObjectId,
  capId,
  vaultId,
  sender,
}: {
  pendingObjectId: string;
  capId: string;
  vaultId: string;
  sender: string;
}) {
  const tx = new Transaction();

  // approve_pending returns Coin<SUI> by value — capability.move has no
  // dedicated transfer-wrapper for it, so the PTB must handle the coin
  // itself in the same transaction.
  const coin = tx.moveCall({
    target: `${PACKAGE_ID}::capability::approve_pending`,
    arguments: [tx.object(pendingObjectId), tx.object(capId), tx.object(vaultId)],
  });
  tx.transferObjects([coin], sender);

  return signAndExecuteSponsoredTransaction({
    transaction: tx,
    sender,
    allowedMoveCallTargets: [`${PACKAGE_ID}::capability::approve_pending`],
    allowedAddresses: [sender],
  });
}

export async function rejectPendingAction({
  pendingObjectId,
  capId,
  sender,
}: {
  pendingObjectId: string;
  capId: string;
  sender: string;
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::capability::reject_pending`,
    arguments: [tx.object(pendingObjectId), tx.object(capId)],
  });

  return signAndExecuteSponsoredTransaction({
    transaction: tx,
    sender,
    allowedMoveCallTargets: [`${PACKAGE_ID}::capability::reject_pending`],
    allowedAddresses: [sender],
  });
}
