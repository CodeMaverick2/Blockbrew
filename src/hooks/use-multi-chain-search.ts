"use client";

import { useState, useCallback, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Transaction,
  ChainSearchResult,
  AggregatedStats,
} from "@/types";
import { fetchTransactions, validateAddress } from "@/services/blockchain";
import { SUPPORTED_CHAINS } from "@/config/chains";

// Chains that support multi-chain search (EVM chains with same address format)
// Note: Ronin excluded due to Cloudflare protection on their API
const MULTI_CHAIN_COMPATIBLE = [
  "ethereum",
  "polygon",
  "arbitrum",
  "optimism",
  "base",
  "bsc",
  "avalanche",
];

// Check if an address looks like an EVM address (0x followed by 40 hex chars)
function isEvmAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function useMultiChainSearch(
  address: string,
  enabled: boolean = false
) {
  const [isMultiChainMode, setIsMultiChainMode] = useState(false);

  // Check if address is EVM-compatible (same format works on all EVM chains)
  const isEvmCompatible = useMemo(() => isEvmAddress(address), [address]);

  // Get chains compatible with the address format
  const compatibleChains = useMemo(() => {
    if (!address) return [];

    // For EVM addresses, all EVM chains are compatible
    if (isEvmCompatible) {
      return MULTI_CHAIN_COMPATIBLE;
    }

    return MULTI_CHAIN_COMPATIBLE.filter((chainId) =>
      validateAddress(address, chainId)
    );
  }, [address, isEvmCompatible]);

  // Potential chains count (shown even before full validation)
  const potentialChainCount = isEvmCompatible ? MULTI_CHAIN_COMPATIBLE.length : compatibleChains.length;

  // Create queries for each compatible chain
  const chainQueries = useQueries({
    queries: compatibleChains.map((chainId) => ({
      queryKey: ["multiChain", chainId, address],
      queryFn: async () => {
        const allTransactions: Transaction[] = [];
        let page = 1;
        const maxPages = 2; // Limit pages for multi-chain to avoid rate limits
        let hasMore = true;

        while (hasMore && page <= maxPages) {
          const result = await fetchTransactions(address, chainId, page, 100);
          allTransactions.push(...result.transactions);
          hasMore = result.hasMore;
          page++;
          if (hasMore && page <= maxPages) {
            await new Promise((r) => setTimeout(r, 300)); // Slightly longer delay for multi-chain
          }
        }

        return {
          chainId,
          transactions: allTransactions,
          totalCount: allTransactions.length,
        };
      },
      enabled: enabled && isMultiChainMode && !!address,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  // Aggregate results from all chains
  const results = useMemo(() => {
    const chainResults: Record<string, ChainSearchResult> = {};

    compatibleChains.forEach((chainId, index) => {
      const query = chainQueries[index];
      chainResults[chainId] = {
        chainId,
        transactions: query.data?.transactions || [],
        totalCount: query.data?.totalCount || 0,
        isLoading: query.isLoading || query.isFetching,
        error: query.error?.message,
      };
    });

    return chainResults;
  }, [compatibleChains, chainQueries]);

  // Calculate aggregated stats
  const aggregatedStats = useMemo((): AggregatedStats => {
    const stats: AggregatedStats = {
      totalTransactions: 0,
      totalReceived: 0,
      totalSent: 0,
      totalFees: 0,
      chainBreakdown: {},
    };

    Object.values(results).forEach((result) => {
      if (result.transactions.length === 0) return;

      const chainStats = {
        count: result.transactions.length,
        received: 0,
        sent: 0,
        fees: 0,
      };

      result.transactions.forEach((tx) => {
        const value = parseFloat(tx.value) || 0;
        const fee = parseFloat(tx.fee) || 0;
        const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();

        if (isOutgoing) {
          chainStats.sent += value;
          chainStats.fees += fee;
        } else {
          chainStats.received += value;
        }
      });

      stats.totalTransactions += chainStats.count;
      stats.totalReceived += chainStats.received;
      stats.totalSent += chainStats.sent;
      stats.totalFees += chainStats.fees;
      stats.chainBreakdown[result.chainId] = chainStats;
    });

    return stats;
  }, [results, address]);

  // Get all transactions from all chains (sorted by timestamp)
  const allTransactions = useMemo(() => {
    const txs: Transaction[] = [];

    Object.values(results).forEach((result) => {
      txs.push(...result.transactions);
    });

    // Sort by timestamp descending
    txs.sort((a, b) => {
      const tsA = typeof a.timestamp === "string" ? parseInt(a.timestamp) : a.timestamp;
      const tsB = typeof b.timestamp === "string" ? parseInt(b.timestamp) : b.timestamp;
      return tsB - tsA;
    });

    return txs;
  }, [results]);

  // Check if any chain is still loading
  const isLoading = chainQueries.some((q) => q.isLoading);
  const isFetching = chainQueries.some((q) => q.isFetching);

  // Get chains with transactions
  const chainsWithResults = useMemo(() => {
    return Object.entries(results)
      .filter(([_, result]) => result.transactions.length > 0)
      .map(([chainId]) => chainId);
  }, [results]);

  // Toggle multi-chain mode
  const toggleMultiChainMode = useCallback(() => {
    setIsMultiChainMode((prev) => !prev);
  }, []);

  // Enable multi-chain mode
  const enableMultiChainMode = useCallback(() => {
    setIsMultiChainMode(true);
  }, []);

  // Disable multi-chain mode
  const disableMultiChainMode = useCallback(() => {
    setIsMultiChainMode(false);
  }, []);

  return {
    isMultiChainMode,
    toggleMultiChainMode,
    enableMultiChainMode,
    disableMultiChainMode,
    results,
    aggregatedStats,
    allTransactions,
    compatibleChains,
    potentialChainCount,
    isEvmCompatible,
    chainsWithResults,
    isLoading,
    isFetching,
  };
}
