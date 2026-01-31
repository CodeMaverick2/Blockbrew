"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { FlowDataPoint } from "@/types";
import { formatAmount } from "@/lib/utils";

interface FlowChartProps {
  data: FlowDataPoint[];
}

export function FlowChart({ data }: FlowChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No flow data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incomingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outgoingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatAmount(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(value) => [
              formatAmount(value as number),
              "",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) => (
              <span style={{ color: "rgba(255,255,255,0.7)" }}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
          <Area
            type="monotone"
            dataKey="incoming"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#incomingGradient)"
          />
          <Area
            type="monotone"
            dataKey="outgoing"
            stroke="#f87171"
            strokeWidth={2}
            fill="url(#outgoingGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
