"use client";

import { LastProjectsWidget } from "@/components/dashboard/widgets/last-projects-widget";
import { TeamInsightsWidget } from "@/components/dashboard/widgets/team-insights-widget";
import {
  WIDGETS_LEFT_RATIO_DEFAULT,
  WIDGETS_LEFT_RATIO_MAX,
  WIDGETS_LEFT_RATIO_MIN,
  readLayoutPreferences,
  saveLayoutPreferences,
} from "@/lib/dashboard/layout-preferences";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

function clampRatio(ratio: number) {
  return Math.min(
    WIDGETS_LEFT_RATIO_MAX,
    Math.max(WIDGETS_LEFT_RATIO_MIN, ratio),
  );
}

export function DashboardWidgetsSection() {

  
  const containerRef = useRef<HTMLDivElement>(null);
  const ratioRef = useRef(WIDGETS_LEFT_RATIO_DEFAULT);
  const [leftRatio, setLeftRatio] = useState(WIDGETS_LEFT_RATIO_DEFAULT);

  useEffect(() => {
    const initial = readLayoutPreferences().widgetsLeftRatio;
    ratioRef.current = initial;
    setLeftRatio(initial);
  }, []);

  const onDividerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const next = clampRatio((moveEvent.clientX - rect.left) / rect.width);
        ratioRef.current = next;
        setLeftRatio(next);
      };

      const onPointerUp = () => {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener("pointermove", onPointerMove);
        target.removeEventListener("pointerup", onPointerUp);
        target.removeEventListener("pointercancel", onPointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        saveLayoutPreferences({ widgetsLeftRatio: ratioRef.current });
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      target.addEventListener("pointermove", onPointerMove);
      target.addEventListener("pointerup", onPointerUp);
      target.addEventListener("pointercancel", onPointerUp);
    },
    [],
  );

  const leftPercent = `${leftRatio * 100}%`;
  const rightPercent = `${(1 - leftRatio) * 100}%`;

  return (
    <>
      <section
        ref={containerRef}
        className="hidden items-start px-6 pt-2 pb-8 lg:flex"
      >
        <div className="min-w-0 shrink-0 pr-2" style={{ width: leftPercent }}>
          <LastProjectsWidget />
        </div>

        <div
          role="separator"
          tabIndex={0}
          aria-label="Resize widget columns"
          aria-orientation="vertical"
          aria-valuemin={WIDGETS_LEFT_RATIO_MIN * 100}
          aria-valuemax={WIDGETS_LEFT_RATIO_MAX * 100}
          aria-valuenow={Math.round(leftRatio * 100)}
          onPointerDown={onDividerPointerDown}
          className={cn(
            "group/widgets-divider relative mx-0.5 flex w-3 shrink-0 cursor-col-resize items-center justify-center self-center",
            "rounded-full transition-colors hover:bg-white/[0.04]",
          )}
        >
          <span className="h-10 w-1 rounded-full bg-border/70 transition-colors group-hover/widgets-divider:bg-violet-500/60" />
        </div>

        <div className="min-w-0 shrink-0 pl-2" style={{ width: rightPercent }}>
          <TeamInsightsWidget />
        </div>
      </section>

      <section className="grid gap-4 px-6 pt-2 pb-8 lg:hidden">
        <LastProjectsWidget />
        <TeamInsightsWidget />
      </section>
    </>
  );
}

export { WIDGETS_LEFT_RATIO_DEFAULT };
