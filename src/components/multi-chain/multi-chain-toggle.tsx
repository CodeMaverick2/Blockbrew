"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiChainToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  compatibleChainCount: number;
  disabled?: boolean;
}

// Number of EVM chains supported for multi-chain search
// (ethereum, polygon, arbitrum, optimism, base, bsc, avalanche)
// Note: Ronin uses EVM addresses but its API has Cloudflare protection
const EVM_CHAIN_COUNT = 7;

export function MultiChainToggle({
  isEnabled,
  onToggle,
  compatibleChainCount,
  disabled = false,
}: MultiChainToggleProps) {
  // Show potential chains when disabled, actual compatible chains when enabled
  const displayCount = disabled ? EVM_CHAIN_COUNT : compatibleChainCount;
  const isClickable = !disabled && compatibleChainCount >= 2;

  return (
    <button
      onClick={onToggle}
      disabled={!isClickable}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
        "border",
        isEnabled
          ? "bg-white/[0.08] border-white/20 text-foreground"
          : "bg-transparent border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
        !isClickable && "opacity-50 cursor-not-allowed"
      )}
      title={disabled ? "Enter an EVM address (0x...) to enable multi-chain search" : undefined}
    >
      <div className="relative">
        <Layers className={cn("h-4 w-4", isEnabled && "text-emerald-400")} />
        {isEnabled && (
          <motion.div
            layoutId="multi-chain-indicator"
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"
          />
        )}
      </div>

      <span className="font-medium">
        {isEnabled ? "Multi-chain" : "Search all chains"}
      </span>

      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-xs",
          isEnabled ? "bg-white/[0.1]" : "bg-white/[0.05]"
        )}
      >
        {displayCount}
      </span>

      {/* Toggle Switch */}
      <div
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors ml-1",
          isEnabled ? "bg-emerald-500" : "bg-white/[0.1]"
        )}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ x: isEnabled ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
