"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExportFormat, ExportFormatConfig, Transaction } from "@/types";
import {
  generateAwakensCSV,
  downloadCSV,
  generateFilename,
} from "@/services/csv-export";
import { generateKoinlyCSV, downloadKoinlyCSV } from "@/services/csv-export-koinly";
import {
  generateCoinTrackerCSV,
  downloadCoinTrackerCSV,
} from "@/services/csv-export-cointracker";
import { generateTaxBitCSV, downloadTaxBitCSV } from "@/services/csv-export-taxbit";
import { useToast } from "@/components/ui/toast";
import { CHAIN_MAP } from "@/config/chains";

const EXPORT_FORMATS: ExportFormatConfig[] = [
  {
    id: "awaken",
    name: "Awaken",
    description: "Full tax reporting format",
    fileExtension: "csv",
  },
  {
    id: "koinly",
    name: "Koinly",
    description: "Universal crypto tax format",
    fileExtension: "csv",
  },
  {
    id: "cointracker",
    name: "CoinTracker",
    description: "Portfolio tracking format",
    fileExtension: "csv",
  },
  {
    id: "taxbit",
    name: "TaxBit",
    description: "Enterprise tax format",
    fileExtension: "csv",
  },
];

interface ExportDropdownProps {
  transactions: Transaction[];
  userAddress: string;
  chainId: string;
  disabled?: boolean;
}

export function ExportDropdown({
  transactions,
  userAddress,
  chainId,
  disabled = false,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [lastExported, setLastExported] = React.useState<ExportFormat | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    if (!transactions.length || !userAddress) {
      addToast({ type: "error", title: "No data to export" });
      return;
    }

    setIsExporting(true);

    try {
      const chainName = CHAIN_MAP[chainId]?.name || chainId;
      const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
      const date = new Date().toISOString().split("T")[0];

      switch (format) {
        case "awaken": {
          const csv = generateAwakensCSV(transactions, userAddress);
          const filename = generateFilename(userAddress, chainId);
          downloadCSV(csv, filename);
          break;
        }
        case "koinly": {
          const csv = generateKoinlyCSV(transactions, userAddress);
          const filename = `${chainName}_${shortAddress}_${date}_koinly.csv`;
          downloadCSV(csv, filename);
          break;
        }
        case "cointracker": {
          const csv = generateCoinTrackerCSV(transactions, userAddress);
          const filename = `${chainName}_${shortAddress}_${date}_cointracker.csv`;
          downloadCSV(csv, filename);
          break;
        }
        case "taxbit": {
          const csv = generateTaxBitCSV(transactions, userAddress);
          const filename = `${chainName}_${shortAddress}_${date}_taxbit.csv`;
          downloadCSV(csv, filename);
          break;
        }
      }

      setLastExported(format);
      addToast({
        type: "success",
        title: "Exported!",
        message: `${transactions.length} transactions (${EXPORT_FORMATS.find((f) => f.id === format)?.name})`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Export failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting || transactions.length === 0}
        isLoading={isExporting}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export CSV
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-white/[0.08] bg-[#141414] shadow-xl overflow-hidden"
          >
            <div className="p-2">
              <p className="px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Export Format
              </p>
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left",
                    "hover:bg-white/[0.05] transition-colors duration-150",
                    "focus:outline-none focus:bg-white/[0.05]"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{format.name}</span>
                      {lastExported === format.id && (
                        <Check className="h-3 w-3 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-white/[0.06] px-4 py-3 bg-white/[0.02]">
              <p className="text-xs text-muted-foreground">
                {transactions.length} transactions ready to export
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
