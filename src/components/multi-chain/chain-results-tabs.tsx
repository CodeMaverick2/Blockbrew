"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ChainSearchResult } from "@/types";
import { CHAIN_MAP } from "@/config/chains";
import { cn } from "@/lib/utils";

interface ChainResultsTabsProps {
  results: Record<string, ChainSearchResult>;
  activeChain: string | null;
  onChainSelect: (chainId: string | null) => void;
  chainsWithResults: string[];
}

export function ChainResultsTabs({
  results,
  activeChain,
  onChainSelect,
  chainsWithResults,
}: ChainResultsTabsProps) {
  const allChains = Object.keys(results);

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {/* All Chains Tab */}
        <button
          onClick={() => onChainSelect(null)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all",
            activeChain === null
              ? "bg-white/[0.08] border border-white/20 text-foreground"
              : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
          )}
        >
          <span>All Chains</span>
          <span className="px-1.5 py-0.5 rounded bg-white/[0.1] text-xs">
            {Object.values(results).reduce((sum, r) => sum + r.totalCount, 0)}
          </span>
        </button>

        <div className="h-5 w-px bg-white/[0.08]" />

        {/* Individual Chain Tabs */}
        {allChains.map((chainId) => {
          const chain = CHAIN_MAP[chainId];
          const result = results[chainId];
          const hasResults = result.totalCount > 0;
          const isActive = activeChain === chainId;

          return (
            <button
              key={chainId}
              onClick={() => onChainSelect(chainId)}
              disabled={result.isLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all",
                isActive
                  ? "bg-white/[0.08] border border-white/20 text-foreground"
                  : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
                !hasResults && !result.isLoading && "opacity-50"
              )}
            >
              {/* Chain Icon */}
              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-white/5">
                {chain?.icon && (
                  <Image
                    src={chain.icon}
                    alt={chain.name}
                    fill
                    className="object-contain p-0.5"
                  />
                )}
              </div>

              <span>{chain?.name || chainId}</span>

              {/* Status Indicator */}
              {result.isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : result.error ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              ) : hasResults ? (
                <span className="px-1.5 py-0.5 rounded bg-white/[0.1] text-xs">
                  {result.totalCount}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/50">0</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress Indicators */}
      <div className="flex flex-wrap gap-2">
        {allChains.map((chainId) => {
          const chain = CHAIN_MAP[chainId];
          const result = results[chainId];

          return (
            <motion.div
              key={chainId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                result.isLoading
                  ? "bg-yellow-400/10 text-yellow-400"
                  : result.error
                  ? "bg-red-400/10 text-red-400"
                  : result.totalCount > 0
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-white/[0.03] text-muted-foreground"
              )}
            >
              {result.isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : result.error ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              <span>{chain?.symbol || chainId}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
