"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Star,
  Trash2,
  X,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressItem } from "./address-item";
import { cn } from "@/lib/utils";
import { SavedAddress } from "@/types";

interface AddressSidebarProps {
  recentAddresses: SavedAddress[];
  bookmarkedAddresses: SavedAddress[];
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, chainId: string) => void;
  onToggleBookmark: (address: string, chainId: string, label?: string) => void;
  onRemoveRecent: (address: string, chainId: string) => void;
  onRemoveBookmark: (address: string, chainId: string) => void;
  onUpdateLabel: (address: string, chainId: string, label: string) => void;
  onClearRecent: () => void;
}

export function AddressSidebar({
  recentAddresses,
  bookmarkedAddresses,
  isOpen,
  onClose,
  onSelectAddress,
  onToggleBookmark,
  onRemoveRecent,
  onRemoveBookmark,
  onUpdateLabel,
  onClearRecent,
}: AddressSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<"recent" | "bookmarks">("recent");
  const modalRef = React.useRef<HTMLDivElement>(null);

  const nonBookmarkedRecent = recentAddresses.filter((a) => !a.isBookmarked);

  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle select and close
  const handleSelect = (address: string, chainId: string) => {
    onSelectAddress(address, chainId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[80vh] bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-lg">Saved Addresses</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-1 border-b border-white/[0.06]">
              <button
                onClick={() => setActiveTab("recent")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === "recent"
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                )}
              >
                <History className="h-4 w-4" />
                Recent
                {nonBookmarkedRecent.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/[0.1] text-xs">
                    {nonBookmarkedRecent.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("bookmarks")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === "bookmarks"
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                )}
              >
                <Star className="h-4 w-4" />
                Bookmarks
                {bookmarkedAddresses.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs">
                    {bookmarkedAddresses.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {activeTab === "recent" ? (
                  nonBookmarkedRecent.length > 0 ? (
                    nonBookmarkedRecent.map((addr) => (
                      <AddressItem
                        key={`${addr.address}-${addr.chainId}`}
                        address={addr}
                        onSelect={handleSelect}
                        onToggleBookmark={onToggleBookmark}
                        onRemove={onRemoveRecent}
                        onUpdateLabel={onUpdateLabel}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No recent searches
                      </p>
                      <p className="text-muted-foreground/60 text-xs mt-1">
                        Your searches will appear here
                      </p>
                    </motion.div>
                  )
                ) : bookmarkedAddresses.length > 0 ? (
                  bookmarkedAddresses.map((addr) => (
                    <AddressItem
                      key={`${addr.address}-${addr.chainId}`}
                      address={addr}
                      onSelect={handleSelect}
                      onToggleBookmark={onRemoveBookmark}
                      onRemove={onRemoveBookmark}
                      onUpdateLabel={onUpdateLabel}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No bookmarked addresses
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      Star addresses to save them
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            {activeTab === "recent" && nonBookmarkedRecent.length > 0 && (
              <div className="p-3 border-t border-white/[0.06]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearRecent}
                  className="w-full gap-2 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear recent history
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Trigger button for opening the modal
interface AddressSidebarTriggerProps {
  onClick: () => void;
  hasAddresses: boolean;
  addressCount: number;
}

export function AddressSidebarTrigger({
  onClick,
  hasAddresses,
  addressCount,
}: AddressSidebarTriggerProps) {
  // Prevent hydration mismatch - localStorage values only available on client
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <History className="h-4 w-4" />
      <span className="hidden sm:inline">Saved</span>
      {mounted && hasAddresses && (
        <span className="px-1.5 py-0.5 rounded-full bg-white/[0.1] text-xs">
          {addressCount}
        </span>
      )}
    </Button>
  );
}
