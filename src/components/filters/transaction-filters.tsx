"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./date-range-picker";
import { TypeFilter } from "./type-filter";
import { StatusFilter } from "./status-filter";
import { cn } from "@/lib/utils";
import { TransactionType, TransactionStatus, ExtendedTransactionFilters } from "@/types";

interface TransactionFiltersProps {
  filters: ExtendedTransactionFilters;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  onDatePresetChange: (preset: "7d" | "30d" | "90d" | "custom" | undefined) => void;
  onTypeChange: (types: TransactionType[] | undefined) => void;
  onToggleType: (type: TransactionType) => void;
  onToggleStatus: (status: TransactionStatus) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  allTransactionTypes: TransactionType[];
}

export function TransactionFilters({
  filters,
  onDateChange,
  onDatePresetChange,
  onTypeChange,
  onToggleType,
  onToggleStatus,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  allTransactionTypes,
}: TransactionFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <DateRangePicker
          startDate={filters.startDate}
          endDate={filters.endDate}
          datePreset={filters.datePreset}
          onDateChange={onDateChange}
          onPresetChange={onDatePresetChange}
        />

        <TypeFilter
          selectedTypes={filters.type || []}
          allTypes={allTransactionTypes}
          onTypeChange={onTypeChange}
          onToggleType={onToggleType}
        />

        <div className="h-6 w-px bg-white/[0.08]" />

        <StatusFilter
          selectedStatuses={filters.status || []}
          onToggleStatus={onToggleStatus}
        />

        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(true)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-black text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filter Sheet */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-white/[0.08] rounded-t-2xl md:hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Date Range
                    </label>
                    <DateRangePicker
                      startDate={filters.startDate}
                      endDate={filters.endDate}
                      datePreset={filters.datePreset}
                      onDateChange={onDateChange}
                      onPresetChange={onDatePresetChange}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Transaction Type
                    </label>
                    <TypeFilter
                      selectedTypes={filters.type || []}
                      allTypes={allTransactionTypes}
                      onTypeChange={onTypeChange}
                      onToggleType={onToggleType}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Status
                    </label>
                    <StatusFilter
                      selectedStatuses={filters.status || []}
                      onToggleStatus={onToggleStatus}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        onClearFilters();
                        setIsMobileOpen(false);
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                  <Button
                    className="flex-1"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    Apply filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
