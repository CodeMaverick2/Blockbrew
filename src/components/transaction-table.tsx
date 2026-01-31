"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ExportDropdown } from "@/components/export-dropdown";
import { TransactionDetailPanel } from "@/components/transaction-details/transaction-detail-panel";
import {
  formatAddress,
  formatAmount,
  copyToClipboard,
  getExplorerUrl,
} from "@/lib/utils";
import { CHAIN_MAP } from "@/config/chains";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const columnHelper = createColumnHelper<Transaction>();

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/[0.05] transition-colors"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  userAddress: string;
  chainId: string;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
}

export function TransactionTable({
  transactions,
  isLoading,
  userAddress,
  chainId,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
}: TransactionTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // Use external global filter if provided, otherwise use internal
  const globalFilter = externalGlobalFilter ?? internalGlobalFilter;
  const setGlobalFilter = onGlobalFilterChange ?? setInternalGlobalFilter;

  const columns = React.useMemo(
    () => [
      // Expand column
      columnHelper.display({
        id: "expand",
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="p-1 rounded hover:bg-white/[0.05] transition-colors"
          >
            <motion.div
              animate={{ rotate: row.getIsExpanded() ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
        ),
      }),
      columnHelper.accessor("timestamp", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Time
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const ts = getValue() as number;
          const date = new Date(ts * 1000);
          return (
            <span className="text-muted-foreground whitespace-nowrap">
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              <span className="mx-1 text-muted-foreground/30">·</span>
              {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: ({ getValue }) => (
          <span className="px-2 py-0.5 rounded text-xs bg-white/[0.03] border border-white/[0.06] capitalize">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("hash", {
        header: "Hash",
        cell: ({ row }) => {
          const tx = row.original;
          const explorerUrl = getExplorerUrl(tx.chain, tx.hash, "tx");
          return (
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono text-muted-foreground">
                {formatAddress(tx.hash, 6)}
              </code>
              <CopyButton text={tx.hash} />
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-white/[0.05] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>
          );
        },
      }),
      columnHelper.accessor("from", {
        header: "From",
        cell: ({ getValue }) => {
          const from = getValue();
          const isUser = from.toLowerCase() === userAddress.toLowerCase();
          return (
            <div className="flex items-center gap-1">
              <code
                className={cn(
                  "text-xs font-mono",
                  isUser ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isUser ? "You" : formatAddress(from)}
              </code>
              {!isUser && <CopyButton text={from} />}
            </div>
          );
        },
      }),
      columnHelper.accessor("to", {
        header: "To",
        cell: ({ getValue }) => {
          const to = getValue();
          if (!to) return <span className="text-muted-foreground/30">—</span>;
          const isUser = to.toLowerCase() === userAddress.toLowerCase();
          return (
            <div className="flex items-center gap-1">
              <code
                className={cn(
                  "text-xs font-mono",
                  isUser ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isUser ? "You" : formatAddress(to)}
              </code>
              {!isUser && <CopyButton text={to} />}
            </div>
          );
        },
      }),
      columnHelper.accessor("value", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Amount
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ getValue, row }) => {
          const tx = row.original;
          const value = parseFloat(getValue() as string);
          const symbol = tx.tokenSymbol || CHAIN_MAP[tx.chain]?.symbol || "";
          const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();

          if (value === 0) {
            return <span className="text-muted-foreground/30">—</span>;
          }

          return (
            <span
              className={cn(
                "font-mono tabular-nums",
                isOutgoing ? "text-red-400" : "text-emerald-400"
              )}
            >
              {isOutgoing ? "-" : "+"}
              {formatAmount(value)} {symbol}
            </span>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = parseFloat(rowA.original.value);
          const b = parseFloat(rowB.original.value);
          return a - b;
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full inline-block",
                status === "success"
                  ? "bg-emerald-400"
                  : status === "failed"
                  ? "bg-red-400"
                  : "bg-yellow-400"
              )}
            />
          );
        },
      }),
    ],
    [userAddress]
  );

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting, globalFilter, expanded },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    initialState: { pagination: { pageSize: 25 } },
  });

  if (isLoading) {
    return <TableSkeleton rows={10} />;
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="w-56"
          />
          <span className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} txs
          </span>
        </div>

        <ExportDropdown
          transactions={transactions}
          userAddress={userAddress}
          chainId={chainId}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.05] overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full transaction-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-white/[0.05]">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => (
                <React.Fragment key={row.id}>
                  <motion.tr
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    onClick={() => row.toggleExpanded()}
                    className={cn(
                      "group cursor-pointer",
                      row.getIsExpanded() && "bg-white/[0.02]"
                    )}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </motion.tr>
                  <AnimatePresence>
                    {row.getIsExpanded() && (
                      <tr>
                        <td colSpan={columns.length} className="p-0">
                          <TransactionDetailPanel
                            transaction={row.original}
                            userAddress={userAddress}
                          />
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
