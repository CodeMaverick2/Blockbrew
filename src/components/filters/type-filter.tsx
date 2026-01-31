"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TransactionType } from "@/types";

interface TypeFilterProps {
  selectedTypes: TransactionType[];
  allTypes: TransactionType[];
  onTypeChange: (types: TransactionType[] | undefined) => void;
  onToggleType: (type: TransactionType) => void;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  transfer: "Transfer",
  swap: "Swap",
  stake: "Stake",
  unstake: "Unstake",
  claim: "Claim",
  delegate: "Delegate",
  undelegate: "Undelegate",
  vote: "Vote",
  contract: "Contract",
  approval: "Approval",
  mint: "Mint",
  burn: "Burn",
  bridge: "Bridge",
  deposit: "Deposit",
  withdraw: "Withdraw",
  unknown: "Unknown",
};

export function TypeFilter({
  selectedTypes,
  allTypes,
  onTypeChange,
  onToggleType,
}: TypeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    onTypeChange(undefined);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    onTypeChange(undefined);
  };

  const displayValue = React.useMemo(() => {
    if (selectedTypes.length === 0) return "Type";
    if (selectedTypes.length === 1) return TYPE_LABELS[selectedTypes[0]];
    return `${selectedTypes.length} types`;
  }, [selectedTypes]);

  const hasValue = selectedTypes.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-2 min-w-[100px] justify-between",
          hasValue && "border-white/20"
        )}
      >
        <span className={cn(hasValue && "text-foreground")}>{displayValue}</span>
        {hasValue ? (
          <X
            className="h-3 w-3 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        ) : (
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 z-50 w-56 rounded-xl border border-white/[0.08] bg-[#141414] shadow-xl overflow-hidden"
          >
            <div className="p-2 max-h-[320px] overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Transaction Types
                </span>
                {hasValue && (
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {allTypes.map((type) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => onToggleType(type)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                      "hover:bg-white/[0.05] transition-colors duration-150",
                      isSelected && "bg-white/[0.05]"
                    )}
                  >
                    <span className={cn(isSelected && "text-foreground")}>
                      {TYPE_LABELS[type]}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/[0.06] px-4 py-3 bg-white/[0.02]">
              <Button
                size="sm"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Apply ({selectedTypes.length || "All"})
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
