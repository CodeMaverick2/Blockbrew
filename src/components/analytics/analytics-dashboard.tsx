"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Fuel,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
} from "lucide-react";
import { GasChart } from "./gas-chart";
import { FrequencyChart } from "./frequency-chart";
import { FlowChart } from "./flow-chart";
import { Button } from "@/components/ui/button";
import {
  Transaction,
  AnalyticsData,
  AnalyticsTimeRange,
  GasDataPoint,
  FrequencyDataPoint,
  FlowDataPoint,
  AnalyticsSummary,
  TransactionType,
} from "@/types";
import { formatAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, parseISO } from "date-fns";

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  userAddress: string;
}

const TIME_RANGES: { id: AnalyticsTimeRange; label: string }[] = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "all", label: "All Time" },
];

function computeAnalytics(
  transactions: Transaction[],
  userAddress: string,
  timeRange: AnalyticsTimeRange
): AnalyticsData {
  // Filter transactions by time range
  const now = new Date();
  let startDate: Date | null = null;

  switch (timeRange) {
    case "7d":
      startDate = subDays(now, 7);
      break;
    case "30d":
      startDate = subDays(now, 30);
      break;
    case "90d":
      startDate = subDays(now, 90);
      break;
    case "all":
      startDate = null;
      break;
  }

  const filteredTxs = startDate
    ? transactions.filter((tx) => {
        const ts = typeof tx.timestamp === "string" ? parseInt(tx.timestamp) : tx.timestamp;
        const txDate = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);
        return txDate >= startDate!;
      })
    : transactions;

  // Group by date
  const byDate: Record<string, { txs: Transaction[]; gas: number; incoming: number; outgoing: number }> = {};
  const byDay: Record<string, { incoming: number; outgoing: number }> = {
    Sun: { incoming: 0, outgoing: 0 },
    Mon: { incoming: 0, outgoing: 0 },
    Tue: { incoming: 0, outgoing: 0 },
    Wed: { incoming: 0, outgoing: 0 },
    Thu: { incoming: 0, outgoing: 0 },
    Fri: { incoming: 0, outgoing: 0 },
    Sat: { incoming: 0, outgoing: 0 },
  };

  let totalGas = 0;
  const txCountByType: Record<TransactionType, number> = {} as Record<TransactionType, number>;
  const hourCounts: number[] = new Array(24).fill(0);

  filteredTxs.forEach((tx) => {
    const ts = typeof tx.timestamp === "string" ? parseInt(tx.timestamp) : tx.timestamp;
    const txDate = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);
    const dateKey = format(txDate, "MMM d");
    const dayName = format(txDate, "EEE");
    const hour = txDate.getHours();
    const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
    const value = parseFloat(tx.value) || 0;
    const fee = parseFloat(tx.fee) || 0;

    if (!byDate[dateKey]) {
      byDate[dateKey] = { txs: [], gas: 0, incoming: 0, outgoing: 0 };
    }
    byDate[dateKey].txs.push(tx);
    byDate[dateKey].gas += fee;

    if (isOutgoing) {
      byDate[dateKey].outgoing += value;
      byDay[dayName].outgoing += 1;
    } else {
      byDate[dateKey].incoming += value;
      byDay[dayName].incoming += 1;
    }

    totalGas += fee;
    txCountByType[tx.type] = (txCountByType[tx.type] || 0) + 1;
    hourCounts[hour]++;
  });

  // Create gas over time data
  const gasOverTime: GasDataPoint[] = Object.entries(byDate)
    .map(([date, data]) => ({
      date,
      totalGas: data.gas,
      avgGas: data.gas / data.txs.length,
      txCount: data.txs.length,
    }))
    .reverse();

  // Create frequency by day data
  const frequencyByDay: FrequencyDataPoint[] = Object.entries(byDay).map(
    ([day, data]) => ({
      day,
      count: data.incoming + data.outgoing,
      incoming: data.incoming,
      outgoing: data.outgoing,
    })
  );

  // Create flow data
  const flowData: FlowDataPoint[] = Object.entries(byDate)
    .map(([date, data]) => ({
      date,
      incoming: data.incoming,
      outgoing: data.outgoing,
      net: data.incoming - data.outgoing,
    }))
    .reverse();

  // Find most active day
  let mostActiveDay = "N/A";
  let maxDayCount = 0;
  Object.entries(byDay).forEach(([day, data]) => {
    const total = data.incoming + data.outgoing;
    if (total > maxDayCount) {
      maxDayCount = total;
      mostActiveDay = day;
    }
  });

  // Find peak hour
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  const summary: AnalyticsSummary = {
    totalGasSpent: totalGas,
    avgGasPerTx: filteredTxs.length > 0 ? totalGas / filteredTxs.length : 0,
    txCountByType,
    mostActiveDay,
    peakHour,
  };

  return {
    gasOverTime,
    frequencyByDay,
    flowData,
    summary,
  };
}

export function AnalyticsDashboard({
  transactions,
  userAddress,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = React.useState<AnalyticsTimeRange>("30d");

  const analytics = React.useMemo(
    () => computeAnalytics(transactions, userAddress, timeRange),
    [transactions, userAddress, timeRange]
  );

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No transaction data to analyze</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics</h3>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-all",
                timeRange === range.id
                  ? "bg-white/[0.1] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Fuel className="h-4 w-4 text-orange-400" />
            <span className="text-xs">Total Gas Spent</span>
          </div>
          <p className="text-xl font-mono font-semibold">
            {formatAmount(analytics.summary.totalGasSpent)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-xs">Avg Gas/Tx</span>
          </div>
          <p className="text-xl font-mono font-semibold">
            {formatAmount(analytics.summary.avgGasPerTx)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs">Most Active Day</span>
          </div>
          <p className="text-xl font-semibold">
            {analytics.summary.mostActiveDay}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <span className="text-xs">Peak Hour</span>
          </div>
          <p className="text-xl font-semibold">
            {analytics.summary.peakHour}:00
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gas Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Fuel className="h-4 w-4 text-orange-400" />
            Gas Over Time
          </h4>
          <GasChart data={analytics.gasOverTime} />
        </motion.div>

        {/* Transaction Flow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Value Flow
          </h4>
          <FlowChart data={analytics.flowData} />
        </motion.div>
      </div>

      {/* Frequency Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
      >
        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          Transaction Frequency by Day
        </h4>
        <FrequencyChart data={analytics.frequencyByDay} />
      </motion.div>

      {/* Transaction Type Breakdown */}
      {Object.keys(analytics.summary.txCountByType).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]"
        >
          <h4 className="text-sm font-medium mb-4">Transaction Types</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.summary.txCountByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <span className="text-sm capitalize">{type}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.1] text-xs font-mono">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
