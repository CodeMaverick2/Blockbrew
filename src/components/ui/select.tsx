"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SelectOption {
  value: string;
  label: string;
  icon?: string; // URL to logo
  description?: string;
  color?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  disabled,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div ref={selectRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-all duration-200",
          "bg-[#141414] border border-white/[0.08]",
          "hover:border-white/[0.12] hover:bg-[#181818]",
          "focus:outline-none focus:border-white/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-white/20 bg-[#181818]"
        )}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.icon && (
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
              <Image
                src={selectedOption.icon}
                alt={selectedOption.label}
                fill
                className="object-contain p-0.5"
              />
            </div>
          )}
          {selectedOption?.color && !selectedOption?.icon && (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className={cn(!selectedOption && "text-muted-foreground")}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-full rounded-xl bg-[#141414] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="max-h-[320px] overflow-auto scrollbar-thin p-1.5">
              {options.map((option, index) => (
                <motion.button
                  key={option.value}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                    "hover:bg-white/[0.06]",
                    value === option.value && "bg-white/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                        <Image
                          src={option.icon}
                          alt={option.label}
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                    )}
                    {option.color && !option.icon && (
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className="font-medium">{option.label}</span>
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-emerald-400" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
