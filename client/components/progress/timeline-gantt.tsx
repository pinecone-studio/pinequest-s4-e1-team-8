"use client";

import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { sourceMeta, scaleDayWidth, type TimelineItem, type TimelineScale } from "./timeline-types";
import {
  barMetrics,
  buildRange,
  clampPercent,
  daysBetween,
  formatDate,
  monthSegments,
  offsetX,
  startOfDay,
  weekTicks,
} from "./timeline-utils";

const LABEL_WIDTH = 264;
const HEADER_HEIGHT = 56;
const ROW_HEIGHT = 44;

type TimelineGanttProps = {
  items: TimelineItem[];
  scale: TimelineScale;
};

export function TimelineGantt({ items, scale }: TimelineGanttProps) {
  const dayWidth = scaleDayWidth[scale];
  const range = buildRange(items);
  const totalWidth = range.totalDays * dayWidth;
  const months = monthSegments(range, dayWidth);
  const weeks = weekTicks(range, dayWidth);

  const todayLeft = offsetX(range, startOfDay(new Date()), dayWidth);
  const todayVisible = todayLeft >= 0 && todayLeft <= totalWidth;

  const gridStyle = {
    backgroundImage:
      "linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px)",
    backgroundSize: `${dayWidth * 7}px 100%`,
  } as const;

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-border/60 bg-card scrollbar-thin">
      <div className="flex min-w-max">
        {/* Sticky task labels */}
        <div
          className="sticky left-0 z-20 shrink-0 bg-card"
          style={{ width: LABEL_WIDTH }}
        >
          <div
            className="sticky top-0 z-10 flex items-center border-b border-r border-border/60 bg-card px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            style={{ height: HEADER_HEIGHT }}
          >
            Task
          </div>
          {items.map((item) => {
            const meta = sourceMeta[item.source];
            return (
              <div
                key={item.id}
                className="flex items-center gap-2.5 border-b border-r border-border/40 px-4"
                style={{ height: ROW_HEIGHT }}
              >
                <span className={cn("size-2 shrink-0 rounded-full", meta.dotClass)} />
                <span className="min-w-0 flex-1 truncate text-[13px]" title={item.title}>
                  {item.title}
                </span>
                {item.meta ? (
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {item.meta}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="relative" style={{ width: totalWidth }}>
          <div
            className="sticky top-0 z-10 flex flex-col border-b border-border/60 bg-card"
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="relative flex-1 border-b border-border/40">
              {months.map((segment) => (
                <div
                  key={segment.key}
                  className="absolute top-0 flex h-full items-center border-l border-border/40 pl-2"
                  style={{ left: segment.left, width: segment.width }}
                >
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {segment.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative flex-1">
              {weeks.map((tick) => (
                <div
                  key={tick.key}
                  className="absolute top-0 flex h-full items-center border-l border-border/30 pl-1"
                  style={{ left: tick.left }}
                >
                  <span className="text-[10px] tabular-nums text-muted-foreground/70">
                    {tick.label}
                  </span>
                </div>
              ))}
            </div>
            {todayVisible ? (
              <div
                className="absolute bottom-1 z-10 -translate-x-1/2"
                style={{ left: todayLeft }}
              >
                <span className="rounded-full bg-[#7c3aed] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  Today
                </span>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 opacity-50" style={gridStyle} />
            {todayVisible ? (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[#7c3aed]/60"
                style={{ left: todayLeft }}
              />
            ) : null}
            {items.map((item) => (
              <div
                key={item.id}
                className="relative border-b border-border/40"
                style={{ height: ROW_HEIGHT }}
              >
                <TimelineBar item={item} range={range} dayWidth={dayWidth} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type TimelineBarProps = {
  item: TimelineItem;
  range: ReturnType<typeof buildRange>;
  dayWidth: number;
};

function TimelineBar({ item, range, dayWidth }: TimelineBarProps) {
  const { left, width } = barMetrics(item, range, dayWidth);
  const meta = sourceMeta[item.source];
  const progress = clampPercent(item.progress);
  const durationDays = Math.max(daysBetween(item.start, item.end), 1);

  const inner = (
    <>
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full", meta.fillClass)}
        style={{ width: `${progress}%` }}
      />
      {width >= 56 ? (
        <span className="relative z-10 flex w-full items-center gap-1 truncate px-2.5 text-[11px] font-medium text-foreground">
          <span className="truncate">{item.title}</span>
          {item.url ? <ExternalLink className="size-3 shrink-0 opacity-60" /> : null}
        </span>
      ) : null}
    </>
  );

  const barClass = cn(
    "relative flex h-6 items-center overflow-hidden rounded-full ring-1 transition-shadow hover:shadow-md",
    meta.trackClass,
    item.blocked && "ring-2 ring-rose-500/60",
  );

  return (
    <div
      className="group absolute top-1/2 -translate-y-1/2"
      style={{ left, width }}
    >
      {item.url ? (
        <a href={item.url} target="_blank" rel="noreferrer" className={barClass}>
          {inner}
        </a>
      ) : (
        <div className={barClass}>{inner}</div>
      )}

      <div
        className={cn(
          "pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-56 rounded-xl border border-border/60 bg-popover p-3 text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100",
        )}
      >
        <p className="mb-1 line-clamp-2 font-semibold text-popover-foreground">
          {item.title}
        </p>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{meta.label}</span>
          <span>{item.status}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-muted-foreground">
          <span>
            {formatDate(item.start)} – {formatDate(item.end)}
          </span>
          <span className="tabular-nums">{durationDays}d</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", meta.fillClass)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-[10px] tabular-nums text-muted-foreground">
          {progress}%
        </p>
      </div>
    </div>
  );
}
