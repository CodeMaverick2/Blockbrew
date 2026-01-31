"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  ExtendedTransactionFilters,
} from "@/types";
import { subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

const ALL_TRANSACTION_TYPES: TransactionType[] = [
  "transfer",
  "swap",
  "stake",
  "unstake",
  "claim",
  "delegate",
  "undelegate",
  "vote",
  "contract",
  "approval",
  "mint",
  "burn",
  "bridge",
  "deposit",
  "withdraw",
  "unknown",
];

const ALL_STATUSES: TransactionStatus[] = ["success", "failed", "pending"];

const initialFilters: ExtendedTransactionFilters = {
  startDate: undefined,
  endDate: undefined,
  type: undefined,
  status: undefined,
  minValue: undefined,
  maxValue: undefined,
  search: undefined,
  datePreset: undefined,
};

export function useTransactionFilters() {
  const [filters, setFilters] = useState<ExtendedTransactionFilters>(initialFilters);

  // Set date range from preset
  const setDatePreset = useCallback((preset: "7d" | "30d" | "90d" | "custom" | undefined) => {
    if (!preset || preset === "custom") {
      setFilters((prev) => ({ ...prev, datePreset: preset }));
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (preset) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      default:
        return;
    }

    setFilters((prev) => ({
      ...prev,
      startDate: startOfDay(startDate),
      endDate: endOfDay(now),
      datePreset: preset,
    }));
  }, []);

  // Set custom date range
  const setDateRange = useCallback((startDate?: Date, endDate?: Date) => {
    setFilters((prev) => ({
      ...prev,
      startDate: startDate ? startOfDay(startDate) : undefined,
      endDate: endDate ? endOfDay(endDate) : undefined,
      datePreset: "custom",
    }));
  }, []);

  // Set transaction types filter
  const setTypeFilter = useCallback((types: TransactionType[] | undefined) => {
    setFilters((prev) => ({ ...prev, type: types?.length ? types : undefined }));
  }, []);

  // Toggle a single type
  const toggleType = useCallback((type: TransactionType) => {
    setFilters((prev) => {
      const current = prev.type || [];
      const isSelected = current.includes(type);

      if (isSelected) {
        const updated = current.filter((t) => t !== type);
        return { ...prev, type: updated.length ? updated : undefined };
      } else {
        return { ...prev, type: [...current, type] };
      }
    });
  }, []);

  // Set status filter
  const setStatusFilter = useCallback((statuses: TransactionStatus[] | undefined) => {
    setFilters((prev) => ({ ...prev, status: statuses?.length ? statuses : undefined }));
  }, []);

  // Toggle a single status
  const toggleStatus = useCallback((status: TransactionStatus) => {
    setFilters((prev) => {
      const current = prev.status || [];
      const isSelected = current.includes(status);

      if (isSelected) {
        const updated = current.filter((s) => s !== status);
        return { ...prev, status: updated.length ? updated : undefined };
      } else {
        return { ...prev, status: [...current, status] };
      }
    });
  }, []);

  // Set search filter
  const setSearchFilter = useCallback((search: string | undefined) => {
    setFilters((prev) => ({ ...prev, search: search?.trim() || undefined }));
  }, []);

  // Set value range filter
  const setValueRange = useCallback((minValue?: number, maxValue?: number) => {
    setFilters((prev) => ({ ...prev, minValue, maxValue }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.startDate !== undefined ||
      filters.endDate !== undefined ||
      (filters.type !== undefined && filters.type.length > 0) ||
      (filters.status !== undefined && filters.status.length > 0) ||
      filters.minValue !== undefined ||
      filters.maxValue !== undefined ||
      (filters.search !== undefined && filters.search.length > 0)
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.type?.length) count++;
    if (filters.status?.length) count++;
    if (filters.minValue !== undefined || filters.maxValue !== undefined) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // Apply filters to transactions
  const applyFilters = useCallback(
    (transactions: Transaction[]): Transaction[] => {
      return transactions.filter((tx) => {
        // Date range filter
        if (filters.startDate || filters.endDate) {
          const txDate = new Date(
            typeof tx.timestamp === "number"
              ? tx.timestamp > 10000000000
                ? tx.timestamp
                : tx.timestamp * 1000
              : parseInt(tx.timestamp as unknown as string) * 1000
          );

          if (filters.startDate && filters.endDate) {
            if (!isWithinInterval(txDate, { start: filters.startDate, end: filters.endDate })) {
              return false;
            }
          } else if (filters.startDate && txDate < filters.startDate) {
            return false;
          } else if (filters.endDate && txDate > filters.endDate) {
            return false;
          }
        }

        // Type filter
        if (filters.type?.length && !filters.type.includes(tx.type)) {
          return false;
        }

        // Status filter
        if (filters.status?.length && !filters.status.includes(tx.status)) {
          return false;
        }

        // Value range filter
        const value = parseFloat(tx.value);
        if (filters.minValue !== undefined && value < filters.minValue) {
          return false;
        }
        if (filters.maxValue !== undefined && value > filters.maxValue) {
          return false;
        }

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            tx.hash.toLowerCase().includes(searchLower) ||
            tx.from.toLowerCase().includes(searchLower) ||
            tx.to.toLowerCase().includes(searchLower) ||
            tx.type.toLowerCase().includes(searchLower) ||
            tx.tokenSymbol?.toLowerCase().includes(searchLower) ||
            tx.method?.toLowerCase().includes(searchLower);

          if (!matchesSearch) {
            return false;
          }
        }

        return true;
      });
    },
    [filters]
  );

  return {
    filters,
    setFilters,
    setDatePreset,
    setDateRange,
    setTypeFilter,
    toggleType,
    setStatusFilter,
    toggleStatus,
    setSearchFilter,
    setValueRange,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    applyFilters,
    allTransactionTypes: ALL_TRANSACTION_TYPES,
    allStatuses: ALL_STATUSES,
  };
}
