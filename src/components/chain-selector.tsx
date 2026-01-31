"use client";

import * as React from "react";
import { SUPPORTED_CHAINS } from "@/config/chains";
import { Select } from "@/components/ui/select";

interface ChainSelectorProps {
  value: string;
  onChange: (chainId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChainSelector({
  value,
  onChange,
  disabled,
  className,
}: ChainSelectorProps) {
  const options = SUPPORTED_CHAINS.map((chain) => ({
    value: chain.id,
    label: chain.name,
    icon: chain.icon,
    color: chain.color,
  }));

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select network..."
      disabled={disabled}
      className={className}
    />
  );
}
