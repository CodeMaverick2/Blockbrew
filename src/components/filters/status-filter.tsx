"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TransactionStatus } from "@/types";

interface StatusFilterProps {
  selectedStatuses: TransactionStatus[];
  onToggleStatus: (status: TransactionStatus) => void;
}

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; color: string; bgColor: string }
> = {
  success: {
    label: "Success",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10 border-emerald-400/20",
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/20",
  },
  pending: {
    label: "Pending",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10 border-yellow-400/20",
  },
};

const ALL_STATUSES: TransactionStatus[] = ["success", "failed", "pending"];

export function StatusFilter({
  selectedStatuses,
  onToggleStatus,
}: StatusFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      {ALL_STATUSES.map((status) => {
        const config = STATUS_CONFIG[status];
        const isSelected = selectedStatuses.includes(status);
        const isAllSelected = selectedStatuses.length === 0;

        return (
          <button
            key={status}
            onClick={() => onToggleStatus(status)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
              isSelected || isAllSelected
                ? config.bgColor
                : "bg-transparent border-white/[0.08] text-muted-foreground",
              isSelected && config.color,
              "hover:border-white/20"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isSelected || isAllSelected ? config.color.replace("text-", "bg-") : "bg-muted-foreground/50"
                )}
              />
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
