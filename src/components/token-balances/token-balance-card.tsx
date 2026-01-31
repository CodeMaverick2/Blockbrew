"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Coins } from "lucide-react";
import { TokenBalance } from "@/types";
import { getExplorerUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Format large numbers to avoid overflow and scientific notation
function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return "0";

  // Handle very small numbers
  if (num > 0 && num < 0.000001) {
    return "<0.000001";
  }

  // Handle large numbers with abbreviations
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + "T";
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + "B";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + "M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + "K";
  }

  // Normal numbers - limit decimal places
  if (num >= 1) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  // Small decimals
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

interface TokenBalanceCardProps {
  token: TokenBalance;
  index: number;
}

export function TokenBalanceCard({ token, index }: TokenBalanceCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const explorerUrl =
    token.address !== "native"
      ? getExplorerUrl(token.chain, token.address, "address")
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={cn(
        "relative p-4 rounded-xl border border-white/[0.06]",
        "bg-[#111111] hover:border-white/[0.1] transition-all duration-200",
        "group"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Token Icon */}
        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/[0.05] flex-shrink-0 flex items-center justify-center">
          {token.logoUrl && !imageError ? (
            // Use regular img tag for external URLs to avoid Next.js image domain issues
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={token.logoUrl}
              alt={token.symbol}
              className="w-full h-full object-contain p-1"
              onError={() => setImageError(true)}
            />
          ) : (
            <Coins className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{token.symbol}</span>
            {token.address === "native" && (
              <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider bg-white/[0.05] rounded text-muted-foreground">
                Native
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {token.name}
          </p>
        </div>

        {/* Explorer Link */}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        )}
      </div>

      {/* Balance */}
      <div className="mt-3 pt-3 border-t border-white/[0.04]">
        <p className="text-sm font-mono font-medium tabular-nums truncate" title={token.balanceFormatted}>
          {formatBalance(token.balanceFormatted)}
        </p>
        {token.balanceUsd && parseFloat(token.balanceUsd) > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            ≈ ${parseFloat(token.balanceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
