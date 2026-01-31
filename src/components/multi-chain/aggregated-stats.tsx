"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Fuel,
  Activity,
  Layers,
} from "lucide-react";
import { AggregatedStats as AggregatedStatsType } from "@/types";
import { CHAIN_MAP } from "@/config/chains";
import { formatAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AggregatedStatsProps {
  stats: AggregatedStatsType;
  isLoading?: boolean;
}

export function AggregatedStats({ stats, isLoading }: AggregatedStatsProps) {
  const chainCount = Object.keys(stats.chainBreakdown).length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs">Total Received</span>
          </div>
          <p className="text-xl font-mono font-semibold text-emerald-400">
            +{formatAmount(stats.totalReceived)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {chainCount} chains
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-xs">Total Sent</span>
          </div>
          <p className="text-xl font-mono font-semibold text-red-400">
            -{formatAmount(stats.totalSent)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {chainCount} chains
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Fuel className="h-4 w-4 text-orange-400" />
            <span className="text-xs">Total Fees</span>
          </div>
          <p className="text-xl font-mono font-semibold">
            {formatAmount(stats.totalFees)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Gas spent</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-xs">Total Transactions</span>
          </div>
          <p className="text-xl font-mono font-semibold">
            {stats.totalTransactions.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            On {chainCount} chains
          </p>
        </motion.div>
      </div>

      {/* Chain Breakdown */}
      {chainCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Chain Breakdown</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.chainBreakdown)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([chainId, chainStats]) => {
                const chain = CHAIN_MAP[chainId];
                const percentage = (chainStats.count / stats.totalTransactions) * 100;

                return (
                  <div key={chainId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                        <span className="text-sm">{chain?.name || chainId}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {chainStats.count} txs
                        </span>
                        <span className="font-mono text-emerald-400">
                          +{formatAmount(chainStats.received)}
                        </span>
                        <span className="font-mono text-red-400">
                          -{formatAmount(chainStats.sent)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: chain?.color || "#ffffff",
                          opacity: 0.6,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
