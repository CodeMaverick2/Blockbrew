"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, X, Clock, Edit2, Check } from "lucide-react";
import { cn, formatAddress } from "@/lib/utils";
import { SavedAddress } from "@/types";
import { CHAIN_MAP } from "@/config/chains";

interface AddressItemProps {
  address: SavedAddress;
  onSelect: (address: string, chainId: string) => void;
  onToggleBookmark: (address: string, chainId: string, label?: string) => void;
  onRemove: (address: string, chainId: string) => void;
  onUpdateLabel: (address: string, chainId: string, label: string) => void;
}

export function AddressItem({
  address,
  onSelect,
  onToggleBookmark,
  onRemove,
  onUpdateLabel,
}: AddressItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [labelValue, setLabelValue] = React.useState(address.label || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const chain = CHAIN_MAP[address.chainId];

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveLabel = () => {
    if (labelValue.trim()) {
      onUpdateLabel(address.address, address.chainId, labelValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveLabel();
    } else if (e.key === "Escape") {
      setLabelValue(address.label || "");
      setIsEditing(false);
    }
  };

  const formatLastSearched = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "group relative p-3 rounded-lg border border-white/[0.06]",
        "hover:border-white/[0.1] hover:bg-white/[0.02] transition-all duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Chain Icon */}
        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
          {chain?.icon && (
            <Image
              src={chain.icon}
              alt={chain.name}
              fill
              className="object-contain p-1"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label or Address */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={handleKeyDown}
                placeholder="Enter label..."
                className="flex-1 bg-transparent border-b border-white/20 text-sm font-medium focus:outline-none focus:border-white/40 py-0.5"
              />
              <button
                onClick={handleSaveLabel}
                className="p-1 rounded hover:bg-white/[0.05] transition-colors"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelect(address.address, address.chainId)}
              className="w-full text-left"
            >
              {address.label ? (
                <div>
                  <p className="text-sm font-medium truncate">{address.label}</p>
                  <code className="text-xs text-muted-foreground font-mono">
                    {formatAddress(address.address, 6)}
                  </code>
                </div>
              ) : (
                <code className="text-sm font-mono text-muted-foreground">
                  {formatAddress(address.address, 8)}
                </code>
              )}
            </button>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground/70">
            <span>{chain?.name || address.chainId}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatLastSearched(address.lastSearched)}
            </span>
            {address.searchCount > 1 && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>{address.searchCount}x</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {address.isBookmarked && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
              title="Edit label"
            >
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => onToggleBookmark(address.address, address.chainId)}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            title={address.isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                address.isBookmarked
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
          {!address.isBookmarked && (
            <button
              onClick={() => onRemove(address.address, address.chainId)}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
              title="Remove"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
