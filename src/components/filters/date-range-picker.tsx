"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  datePreset?: "7d" | "30d" | "90d" | "custom";
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  onPresetChange: (preset: "7d" | "30d" | "90d" | "custom" | undefined) => void;
}

const PRESETS = [
  { id: "7d" as const, label: "Last 7 days" },
  { id: "30d" as const, label: "Last 30 days" },
  { id: "90d" as const, label: "Last 90 days" },
  { id: "custom" as const, label: "Custom range" },
];

// Simple calendar component
function SimpleCalendar({
  selectedStart,
  selectedEnd,
  onSelect,
  month,
  onMonthChange,
}: {
  selectedStart?: Date;
  selectedEnd?: Date;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
}) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-9 h-9" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    date.setHours(0, 0, 0, 0);

    const isToday = date.getTime() === today.getTime();
    const isFuture = date > today;
    const isSelected =
      (selectedStart && date.getTime() === selectedStart.getTime()) ||
      (selectedEnd && date.getTime() === selectedEnd.getTime());
    const isInRange = selectedStart && selectedEnd && date > selectedStart && date < selectedEnd;

    days.push(
      <button
        key={day}
        onClick={() => !isFuture && onSelect(date)}
        disabled={isFuture}
        className={cn(
          "w-9 h-9 rounded-md text-sm transition-colors",
          "hover:bg-white/[0.1]",
          isToday && "bg-white/[0.05] font-medium",
          isSelected && "bg-white text-black font-medium hover:bg-white",
          isInRange && "bg-white/[0.1]",
          isFuture && "opacity-30 cursor-not-allowed"
        )}
      >
        {day}
      </button>
    );
  }

  const prevMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (next <= today) {
      onMonthChange(next);
    }
  };

  return (
    <div className="w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {format(month, "MMMM yyyy")}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="w-9 h-8 flex items-center justify-center text-xs text-muted-foreground">
            {name}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}

export function DateRangePicker({
  startDate,
  endDate,
  datePreset,
  onDateChange,
  onPresetChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [calendarMonth, setCalendarMonth] = React.useState(new Date());
  const [tempStart, setTempStart] = React.useState<Date | undefined>(startDate);
  const [tempEnd, setTempEnd] = React.useState<Date | undefined>(endDate);
  const [selectingEnd, setSelectingEnd] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (startDate && endDate) {
      setTempStart(startDate);
      setTempEnd(endDate);
    }
  }, [startDate, endDate]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePresetClick = (preset: "7d" | "30d" | "90d" | "custom") => {
    if (preset === "custom") {
      setShowCalendar(true);
      setTempStart(undefined);
      setTempEnd(undefined);
      setSelectingEnd(false);
    } else {
      onPresetChange(preset);
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (!selectingEnd || !tempStart) {
      // Selecting start date
      setTempStart(date);
      setTempEnd(undefined);
      setSelectingEnd(true);
    } else {
      // Selecting end date
      if (date < tempStart) {
        // If end is before start, swap them
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
      setSelectingEnd(false);
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onDateChange(tempStart, tempEnd);
      onPresetChange("custom");
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const handleClear = () => {
    setTempStart(undefined);
    setTempEnd(undefined);
    onDateChange(undefined, undefined);
    onPresetChange(undefined);
    setIsOpen(false);
    setShowCalendar(false);
  };

  const displayValue = React.useMemo(() => {
    if (!startDate && !endDate && !datePreset) return "Date range";

    if (datePreset && datePreset !== "custom") {
      const preset = PRESETS.find((p) => p.id === datePreset);
      return preset?.label || "Date range";
    }

    if (startDate && endDate) {
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    }

    return "Date range";
  }, [startDate, endDate, datePreset]);

  const hasValue = startDate || endDate || datePreset;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-2 min-w-[140px] justify-between",
          hasValue && "border-white/20"
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={cn(hasValue && "text-foreground")}>{displayValue}</span>
        </div>
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
            className="absolute left-0 top-full mt-2 z-50 rounded-xl border border-white/[0.08] bg-[#141414] shadow-xl overflow-hidden"
          >
            {!showCalendar ? (
              <div className="p-2 min-w-[180px]">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.id)}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-lg text-sm text-left",
                      "hover:bg-white/[0.05] transition-colors duration-150",
                      datePreset === preset.id && "bg-white/[0.05] text-foreground"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4">
                {/* Selection hint */}
                <div className="mb-4 text-sm text-muted-foreground text-center">
                  {!tempStart ? "Select start date" : !tempEnd ? "Select end date" : "Range selected"}
                </div>

                {/* Selected range display */}
                <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-white/[0.03]">
                  <div className={cn(
                    "flex-1 px-3 py-2 rounded-md text-sm text-center",
                    tempStart ? "bg-white/[0.05]" : "text-muted-foreground"
                  )}>
                    {tempStart ? format(tempStart, "MMM d, yyyy") : "Start date"}
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className={cn(
                    "flex-1 px-3 py-2 rounded-md text-sm text-center",
                    tempEnd ? "bg-white/[0.05]" : "text-muted-foreground"
                  )}>
                    {tempEnd ? format(tempEnd, "MMM d, yyyy") : "End date"}
                  </div>
                </div>

                <SimpleCalendar
                  selectedStart={tempStart}
                  selectedEnd={tempEnd}
                  onSelect={handleDateSelect}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                />

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => {
                      setShowCalendar(false);
                      setTempStart(startDate);
                      setTempEnd(endDate);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={!tempStart || !tempEnd}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
