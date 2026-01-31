"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TokenBalanceCard } from "./token-balance-card";
import { fetchTokenBalances, supportsTokenBalances } from "@/services/token-balance";
import { cn } from "@/lib/utils";

// Number of tokens to show per row (matches grid columns)
const TOKENS_PER_ROW = 5;

interface TokenBalancesSectionProps {
  address: string;
  chainId: string;
}

export function TokenBalancesSection({
  address,
  chainId,
}: TokenBalancesSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isSupported = supportsTokenBalances(chainId);

  const {
    data: tokenData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["tokenBalances", address, chainId],
    queryFn: () => fetchTokenBalances(address, chainId),
    enabled: !!address && !!chainId && isSupported,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  if (!isSupported) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Token Balances</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Token Balances</h3>
        </div>
        <div className="p-6 rounded-xl border border-white/[0.06] bg-[#111111] text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Failed to load token balances
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!tokenData?.tokens.length) {
    return null;
  }

  // Show only first row when collapsed
  const visibleTokens = isExpanded
    ? tokenData.tokens
    : tokenData.tokens.slice(0, TOKENS_PER_ROW);
  const hasMore = tokenData.tokens.length > TOKENS_PER_ROW;
  const hiddenCount = tokenData.tokens.length - TOKENS_PER_ROW;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Token Balances</h3>
          <span className="text-xs text-muted-foreground">
            ({tokenData.tokens.length} tokens)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {visibleTokens.map((token, index) => (
            <TokenBalanceCard
              key={`${token.address}-${token.chain}`}
              token={token}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Show more / Show less button */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {hiddenCount} more tokens
              </>
            )}
          </Button>
        </div>
      )}

      {tokenData.totalValueUsd && isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-sm text-muted-foreground">
            Estimated Total Value:{" "}
            <span className="text-foreground font-medium">
              ${parseFloat(tokenData.totalValueUsd).toLocaleString()}
            </span>
          </p>
        </div>
      )}
    </motion.div>
  );
}
