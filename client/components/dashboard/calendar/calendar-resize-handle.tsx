"use client";

import {
  CALENDAR_VIEWPORT_MAX,
  CALENDAR_VIEWPORT_MIN,
} from "@/lib/dashboard/layout-preferences";
import { useCalendarViewport } from "./calendar-viewport-context";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

export function CalendarResizeHandle() {
  const { setViewportHeight, viewportHeight } = useCalendarViewport();

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = viewportHeight;
      const target = event.currentTarget;

      target.setPointerCapture(event.pointerId);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientY - startY;
        const next = Math.min(
          CALENDAR_VIEWPORT_MAX,
          Math.max(CALENDAR_VIEWPORT_MIN, Math.round(startHeight + delta)),
        );
        setViewportHeight(next);
      };

      const onPointerUp = () => {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener("pointermove", onPointerMove);
        target.removeEventListener("pointerup", onPointerUp);
        target.removeEventListener("pointercancel", onPointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
      target.addEventListener("pointermove", onPointerMove);
      target.addEventListener("pointerup", onPointerUp);
      target.addEventListener("pointercancel", onPointerUp);
    },
    [setViewportHeight, viewportHeight],
  );

  return (
    <button
      type="button"
      aria-label="Resize calendar height"
      onPointerDown={onPointerDown}
      className={cn(
        "absolute right-0 bottom-0 left-0 z-10 flex h-4 cursor-ns-resize items-center justify-center",
        "rounded-b-2xl border-t border-border/80 bg-popover/95 transition-colors",
        "hover:bg-muted group-hover/calendar-resize:bg-muted",
      )}
    >
      <span className="h-1 w-10 rounded-full bg-border transition-colors group-hover/calendar-resize:bg-muted-foreground" />
    </button>
  );
}
