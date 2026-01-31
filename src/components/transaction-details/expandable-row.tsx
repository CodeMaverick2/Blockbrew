"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Transaction } from "@/types";
import { TransactionDetailPanel } from "./transaction-detail-panel";
import { cn } from "@/lib/utils";

interface ExpandableRowProps {
  transaction: Transaction;
  userAddress: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function ExpandableRow({
  transaction,
  userAddress,
  isExpanded,
  onToggle,
  children,
}: ExpandableRowProps) {
  return (
    <>
      <motion.tr
        className={cn(
          "group cursor-pointer",
          isExpanded && "bg-white/[0.02]"
        )}
        onClick={onToggle}
        whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
      >
        <td className="px-2 py-3 w-8">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </td>
        {children}
      </motion.tr>
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={100} className="p-0">
              <TransactionDetailPanel
                transaction={transaction}
                userAddress={userAddress}
              />
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
