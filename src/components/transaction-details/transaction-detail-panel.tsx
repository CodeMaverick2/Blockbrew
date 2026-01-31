"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  ExternalLink,
  Fuel,
  Clock,
  Hash,
  ArrowRight,
  FileCode,
  Layers,
} from "lucide-react";
import { Transaction } from "@/types";
import { CHAIN_MAP } from "@/config/chains";
import {
  formatAddress,
  formatAmount,
  copyToClipboard,
  getExplorerUrl,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TransactionDetailPanelProps {
  transaction: Transaction;
  userAddress: string;
}

function CopyableField({
  label,
  value,
  isMono = true,
}: {
  label: string;
  value: string;
  isMono?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "text-sm truncate",
            isMono && "font-mono"
          )}
          title={value}
        >
          {value}
        </span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/[0.05] transition-colors flex-shrink-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

export function TransactionDetailPanel({
  transaction,
  userAddress,
}: TransactionDetailPanelProps) {
  const chain = CHAIN_MAP[transaction.chain];
  const explorerUrl = getExplorerUrl(transaction.chain, transaction.hash, "tx");

  const formatTimestamp = (timestamp: number | string) => {
    const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
    const date = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  const isOutgoing = transaction.from.toLowerCase() === userAddress.toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="p-4 bg-[#0d0d0d] border-t border-white/[0.04]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Transaction Info */}
          <DetailSection title="Transaction" icon={Hash}>
            <CopyableField label="Hash" value={transaction.hash} />
            <CopyableField
              label="Block"
              value={transaction.blockNumber.toString()}
              isMono={false}
            />
            <div className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-sm text-muted-foreground">Timestamp</span>
              <span className="text-sm text-right">
                {formatTimestamp(transaction.timestamp)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <span
                className={cn(
                  "text-sm capitalize",
                  transaction.status === "success"
                    ? "text-emerald-400"
                    : transaction.status === "failed"
                    ? "text-red-400"
                    : "text-yellow-400"
                )}
              >
                {transaction.status}
              </span>
            </div>
          </DetailSection>

          {/* Addresses */}
          <DetailSection title="Addresses" icon={ArrowRight}>
            <CopyableField label="From" value={transaction.from} />
            <CopyableField label="To" value={transaction.to || "Contract Creation"} />
            <div className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-sm text-muted-foreground">Direction</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  isOutgoing ? "text-red-400" : "text-emerald-400"
                )}
              >
                {isOutgoing ? "Outgoing" : "Incoming"}
              </span>
            </div>
          </DetailSection>

          {/* Value & Gas */}
          <DetailSection title="Value & Fees" icon={Fuel}>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-sm text-muted-foreground">Value</span>
              <span className="text-sm font-mono">
                {formatAmount(transaction.value)} {transaction.tokenSymbol || chain?.symbol}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-sm text-muted-foreground">Fee</span>
              <span className="text-sm font-mono">
                {formatAmount(transaction.fee)} {chain?.symbol}
              </span>
            </div>
            {transaction.gasUsed && (
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">Gas Used</span>
                <span className="text-sm font-mono">
                  {parseInt(transaction.gasUsed).toLocaleString()}
                </span>
              </div>
            )}
            {transaction.gasPrice && (
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">Gas Price</span>
                <span className="text-sm font-mono">
                  {(parseInt(transaction.gasPrice) / 1e9).toFixed(2)} Gwei
                </span>
              </div>
            )}
          </DetailSection>
        </div>

        {/* Method & Input Data */}
        {(transaction.method || transaction.inputData) && (
          <div className="mt-6 pt-6 border-t border-white/[0.04]">
            <DetailSection title="Contract Interaction" icon={FileCode}>
              {transaction.method && (
                <div className="flex items-start justify-between gap-4 py-2.5">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="text-sm font-mono px-2 py-0.5 rounded bg-white/[0.05]">
                    {transaction.method}
                  </span>
                </div>
              )}
              {transaction.inputData && transaction.inputData !== "0x" && (
                <div className="py-2.5">
                  <span className="text-sm text-muted-foreground block mb-2">
                    Input Data
                  </span>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto">
                    <code className="text-xs font-mono text-muted-foreground break-all">
                      {transaction.inputData.length > 200
                        ? `${transaction.inputData.slice(0, 200)}...`
                        : transaction.inputData}
                    </code>
                  </div>
                </div>
              )}
            </DetailSection>
          </div>
        )}

        {/* Token Transfer Info */}
        {transaction.tokenAddress && (
          <div className="mt-6 pt-6 border-t border-white/[0.04]">
            <DetailSection title="Token Details" icon={Layers}>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">Token</span>
                <span className="text-sm">
                  {transaction.tokenName} ({transaction.tokenSymbol})
                </span>
              </div>
              <CopyableField label="Contract" value={transaction.tokenAddress} />
              {transaction.tokenDecimals !== undefined && (
                <div className="flex items-start justify-between gap-4 py-2.5">
                  <span className="text-sm text-muted-foreground">Decimals</span>
                  <span className="text-sm">{transaction.tokenDecimals}</span>
                </div>
              )}
            </DetailSection>
          </div>
        )}

        {/* Explorer Link */}
        <div className="mt-6 pt-4 border-t border-white/[0.04]">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View on {chain?.name} Explorer
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
