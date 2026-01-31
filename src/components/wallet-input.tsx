"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { validateAddress } from "@/services/blockchain";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  chainId: string;
  isLoading?: boolean;
  className?: string;
  skipChainValidation?: boolean;
}

export function WalletInput({
  value,
  onChange,
  onSubmit,
  chainId,
  isLoading,
  className,
  skipChainValidation = false,
}: WalletInputProps) {
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) {
      setError("Enter an address");
      return;
    }

    if (!skipChainValidation && !chainId) {
      setError("Select a network first");
      return;
    }

    if (!skipChainValidation && !validateAddress(value.trim(), chainId)) {
      setError("Invalid address format");
      return;
    }

    setError(null);
    onSubmit();
  };

  const handleClear = () => {
    onChange("");
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          {/* Input wrapper with fixed height for button positioning */}
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={handleChange}
              placeholder="0x..."
              disabled={isLoading}
              className={cn(
                "flex h-11 w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-4 py-2 text-sm transition-all duration-200",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none focus:border-white/20 focus:bg-white/[0.05]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "font-mono pr-10",
                error && "border-red-500/50 focus:border-red-500/70"
              )}
            />
            {value && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Error message outside the relative container */}
          {error && (
            <p className="mt-1.5 text-xs text-red-400">{error}</p>
          )}
        </div>
        <Button
          type="submit"
          variant="default"
          isLoading={isLoading}
          disabled={(!skipChainValidation && !chainId) || !value.trim()}
          leftIcon={!isLoading && <Search className="h-4 w-4" />}
          className="h-11"
        >
          {isLoading ? "Scanning" : "Search"}
        </Button>
      </div>
    </form>
  );
}
