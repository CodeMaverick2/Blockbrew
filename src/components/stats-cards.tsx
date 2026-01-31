"use client";

import * as React from "react";
import { Transaction } from "@/types";
import { CHAIN_MAP } from "@/config/chains";
import { formatAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Flame,
  Activity,
  Calendar,
  Wallet,
} from "lucide-react";

interface StatsCardsProps {
  transactions: Transaction[];
  userAddress: string;
  chainId: string;
}

function AnimatedValue({ value, prefix = "", suffix = "" }: { value: string; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tabular-nums"
    >
      {prefix}{value}{suffix && <span className="text-muted-foreground ml-1 text-sm font-normal">{suffix}</span>}
    </motion.span>
  );
}

export function StatsCards({
  transactions,
  userAddress,
  chainId,
}: StatsCardsProps) {
  const stats = React.useMemo(() => {
    if (!transactions.length) return null;

    const chain = CHAIN_MAP[chainId];
    const symbol = chain?.symbol || "";

    let totalIn = 0;
    let totalOut = 0;
    let totalFees = 0;
    let successCount = 0;

    let earliestTs = Infinity;
    let latestTs = 0;

    for (const tx of transactions) {
      const value = parseFloat(tx.value);
      const fee = parseFloat(tx.fee);
      const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
      const ts = typeof tx.timestamp === "string" ? parseInt(tx.timestamp) : tx.timestamp;

      if (isOutgoing) {
        totalOut += value;
        totalFees += fee;
      } else {
        totalIn += value;
      }

      if (tx.status === "success") successCount++;
      if (ts < earliestTs) earliestTs = ts;
      if (ts > latestTs) latestTs = ts;
    }

    return {
      totalIn,
      totalOut,
      totalFees,
      netFlow: totalIn - totalOut,
      successCount,
      totalCount: transactions.length,
      successRate: ((successCount / transactions.length) * 100).toFixed(0),
      earliestTs: earliestTs === Infinity ? null : earliestTs,
      latestTs: latestTs === 0 ? null : latestTs,
      symbol,
    };
  }, [transactions, userAddress, chainId]);

  if (!stats) return null;

  const cards = [
    {
      label: "Received",
      value: formatAmount(stats.totalIn),
      suffix: stats.symbol,
      icon: ArrowDownLeft,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      trend: "up" as const,
    },
    {
      label: "Sent",
      value: formatAmount(stats.totalOut),
      suffix: stats.symbol,
      icon: ArrowUpRight,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      trend: "down" as const,
    },
    {
      label: "Net Flow",
      value: formatAmount(Math.abs(stats.netFlow)),
      prefix: stats.netFlow >= 0 ? "+" : "-",
      suffix: stats.symbol,
      icon: stats.netFlow >= 0 ? TrendingUp : TrendingDown,
      color: stats.netFlow >= 0 ? "text-emerald-400" : "text-red-400",
      bgColor: stats.netFlow >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      borderColor: stats.netFlow >= 0 ? "border-emerald-500/20" : "border-red-500/20",
    },
    {
      label: "Fees Paid",
      value: formatAmount(stats.totalFees, 6),
      suffix: stats.symbol,
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      label: "Transactions",
      value: stats.totalCount.toString(),
      suffix: `${stats.successRate}% success`,
      icon: Activity,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Period",
      value: stats.earliestTs
        ? `${new Date(stats.earliestTs * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "-",
      suffix: stats.latestTs
        ? `→ ${new Date(stats.latestTs * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "",
      icon: Calendar,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ y: -2, scale: 1.02 }}
            className={cn(
              "relative p-4 rounded-xl border overflow-hidden group cursor-default",
              "bg-white/[0.02]",
              card.borderColor
            )}
          >
            {/* Animated background glow */}
            <motion.div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                card.bgColor
              )}
              style={{ filter: "blur(40px)" }}
            />

            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={cn("p-1.5 rounded-md", card.bgColor)}>
                  <Icon className={cn("w-3.5 h-3.5", card.color)} />
                </div>
              </div>

              <p className={cn("text-xl font-semibold", card.color)}>
                <AnimatedValue
                  value={card.value}
                  prefix={card.prefix}
                  suffix={card.suffix}
                />
              </p>
            </div>

            {/* Decorative corner */}
            <div
              className={cn(
                "absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-10",
                card.bgColor
              )}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
