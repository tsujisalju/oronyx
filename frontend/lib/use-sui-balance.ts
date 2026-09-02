"use client";

import { useCallback, useEffect, useState } from "react";
import { useCurrentClient } from "@mysten/dapp-kit-react";

export function useSuiBalance(address?: string) {
  const client = useCurrentClient();
  const [balanceMist, setBalanceMist] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!address) {
      setBalanceMist(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await client.getBalance({ owner: address });
      setBalanceMist(Number(result.balance.balance));
    } catch (error) {
      console.error("Failed to fetch SUI balance:", error);
      setBalanceMist(null);
    } finally {
      setIsLoading(false);
    }
  }, [client, address]);

  useEffect(() => {
    Promise.resolve().then(() => refetch());
  }, [refetch]);

  return { balanceMist, isLoading, refetch };
}
