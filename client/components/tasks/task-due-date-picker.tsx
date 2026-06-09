"use client";

import { detailInputClass } from "@/components/tasks/task-detail-ui";
import { formatDueDateShort } from "@/components/tasks/task-detail-utils";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type TaskDueDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateValue(value: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = firstDay.getDay();
  const days: Array<Date | null> = Array.from({ length: leadingEmpty }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export function TaskDueDatePicker({ value, onChange }: TaskDueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);
  const [viewDate, setViewDate] = useState(
    () => selectedDate ?? new Date(),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const calendarDays = useMemo(
    () => getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const openCalendar = () => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
    setOpen((current) => !current);
  };

  const selectDate = (date: Date) => {
    onChange(toDateValue(date));
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <div ref={containerRef} className="relative flex max-w-xs items-center gap-2">
      <div
        className={cn(
          detailInputClass,
          "inline-flex flex-1 items-center gap-2 px-3",
        )}
      >
        <button
          type="button"
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          aria-label="Open calendar"
          aria-expanded={open}
          onClick={openCalendar}
        >
          <CalendarDays className="size-3.5" />
        </button>
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <button
            type="button"
            className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            aria-label="Clear due date"
            onClick={() => onChange("")}
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>

      {value ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDueDateShort(value)}
        </span>
      ) : null}

      {open ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-xl border border-border/60 bg-muted p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-medium">{monthLabel}</p>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {weekdayLabels.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) =>
              date ? (
                <button
                  key={toDateValue(date)}
                  type="button"
                  className={cn(
                    "grid h-9 place-items-center rounded-md text-sm transition-colors",
                    selectedDate && date.getTime() === selectedDate.getTime()
                      ? "bg-violet-500 font-medium text-white"
                      : date.getTime() === today.getTime()
                        ? "border border-violet-500/40 text-violet-800 dark:text-violet-300 hover:bg-muted/30"
                        : "text-foreground hover:bg-muted/30",
                  )}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
