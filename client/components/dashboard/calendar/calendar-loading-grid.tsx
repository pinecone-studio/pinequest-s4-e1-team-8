import {
  HOUR_HEIGHT_PX,
  TOTAL_GRID_HEIGHT_PX,
  getTimeLabels,
} from "@/lib/dashboard/calendar-engine";
import { CALENDAR_GUTTER_WIDTH } from "@/lib/dashboard/calendar-layout";
import { CalendarFrame } from "./calendar-frame";

interface CalendarLoadingGridProps {
  weekStart: number;
  todayMidnight: number;
}

export function CalendarLoadingGrid({
  weekStart,
  todayMidnight,
}: CalendarLoadingGridProps) {
  const timeLabels = getTimeLabels();

  return (
    <CalendarFrame weekStart={weekStart} todayMidnight={todayMidnight}>
      <div className="relative flex" style={{ height: TOTAL_GRID_HEIGHT_PX }}>
        <div
          className="relative shrink-0 border-r border-border"
          style={{ width: CALENDAR_GUTTER_WIDTH, height: TOTAL_GRID_HEIGHT_PX }}
        >
          {timeLabels.map(({ hour, label, topPx }) => (
            <span
              key={hour}
              className="absolute right-[8px] -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground"
              style={{ top: topPx }}
            >
              {label}
            </span>
          ))}
        </div>

        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="relative flex-1 border-l border-border bg-popover"
            style={{ height: TOTAL_GRID_HEIGHT_PX }}
          >
            {Array.from({ length: 24 }).map((__, hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-border"
                style={{ top: hour * HOUR_HEIGHT_PX }}
              />
            ))}
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-popover/40">
          <span className="animate-pulse text-xs text-muted-foreground">
            Loading calendar…
          </span>
        </div>
      </div>
    </CalendarFrame>
  );
}
