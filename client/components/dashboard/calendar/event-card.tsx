"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/dashboard/calendar-types";
import { EVENT_COLORS } from "@/lib/dashboard/calendar-types";
import { cn } from "@/lib/utils";
import { Video, FileText, Check } from "lucide-react";

interface EventCardProps {
  event: CalendarEvent;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDragEnd: () => void;
}

export function EventCard({ event, isDragging, onDragStart, onDragEnd }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = EVENT_COLORS[event.color];
  const layout = event._layout!;

  // Height-based density tiers
  const isTiny   = layout.heightPx < 24;  // title only, no padding
  const isCompact = layout.heightPx < 44;  // title + time on one line
  const isSmall   = layout.heightPx < 70;  // title + time stacked, no attendees
  const isMedium  = layout.heightPx < 100; // + attendees

  const start = new Date(event.startUnix);
  const end   = new Date(event.endUnix);
  const fmt   = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const timeLabel = `${fmt(start)} – ${fmt(end)}`;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, event)}
      onDragEnd={onDragEnd}
      onClick={() => !isSmall && setExpanded(v => !v)}
      className={cn(
        "absolute overflow-hidden rounded-[8px] select-none",
        "cursor-grab active:cursor-grabbing",
        "transition-[opacity,box-shadow] duration-150",
        isDragging ? "opacity-30 scale-[0.98]" : "hover:brightness-110",
      )}
      style={{
        top:             layout.topPx,
        height:          layout.heightPx,
        left:            `calc(${layout.leftPct}% + 3px)`,
        width:           `calc(${layout.widthPct}% - 6px)`,
        backgroundColor: colors.bg,
        color:           colors.text,
        boxShadow:       `0 2px 16px ${colors.glow}, 0 1px 3px rgba(0,0,0,0.5)`,
      }}
    >
      {/* 3 px left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-70"
        style={{ backgroundColor: colors.accent }}
      />

      {/* ── Tiny: single line, no padding ── */}
      {isTiny ? (
        <p className="truncate pl-[6px] pr-[4px] text-[10px] font-semibold leading-[22px]">
          {event.title}
        </p>
      ) : isCompact ? (
        /* ── Compact: title + time on one line ── */
        <div className="flex items-baseline gap-[4px] pl-[8px] pr-[5px] py-[4px]">
          <p className="truncate text-[11px] font-semibold leading-tight flex-1 min-w-0">
            {event.title}
          </p>
          <span className="shrink-0 text-[9px] opacity-70 tabular-nums whitespace-nowrap">
            {fmt(start)}
          </span>
        </div>
      ) : (
        /* ── Normal: stacked layout ── */
        <div className="flex h-full flex-col gap-[2px] pl-[8px] pr-[6px] py-[6px] leading-tight overflow-hidden">

          {/* Title */}
          <p className="font-semibold truncate text-[12px]">
            {event.title}
          </p>

          {/* Time */}
          <p className="text-[10px] opacity-75 tabular-nums">{timeLabel}</p>

          {/* Attendee avatars */}
          {!isSmall && !isMedium && event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-[2px] mt-[4px]">
              {event.attendees.slice(0, 4).map(att => (
                <span
                  key={att.email}
                  className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white ring-[1.5px] ring-black/20"
                  style={{ backgroundColor: att.color }}
                  title={att.displayName ?? att.email}
                >
                  {att.initials.slice(0, 2)}
                </span>
              ))}
              {event.attendees.length > 4 && (
                <span className="text-[9px] opacity-60">+{event.attendees.length - 4}</span>
              )}
            </div>
          )}

          {/* Checklist preview */}
          {!isMedium && event.checklistItems && event.checklistItems.length > 0 && (
            <ul className="mt-[3px] space-y-[2px] overflow-hidden flex-1 min-h-0">
              {event.checklistItems.slice(0, expanded ? 999 : 4).map(item => (
                <li key={item.id} className="flex items-center gap-1 text-[9px]">
                  <span
                    className={cn(
                      "flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-[2px] border",
                      item.done ? "opacity-90" : "opacity-40",
                    )}
                    style={{
                      borderColor:     "currentColor",
                      backgroundColor: item.done ? "currentColor" : "transparent",
                    }}
                  >
                    {item.done && <Check className="h-2 w-2" strokeWidth={3} style={{ color: colors.bg }} />}
                  </span>
                  <span className={cn(item.done && "line-through opacity-50")}>{item.label}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Meet join button */}
          {!isSmall && event.meetUrl && (
            <div className="mt-auto flex items-center justify-between gap-1 pt-[2px]">
              <span className="truncate text-[9px] opacity-60 underline decoration-dotted">
                {event.meetUrl.replace(/^https?:\/\//, "")}
              </span>
              <a
                href={event.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className={cn(
                  "flex flex-shrink-0 items-center gap-[3px] rounded-full px-[7px] py-[2px]",
                  "text-[9px] font-bold tracking-wide shadow-sm",
                  "transition-opacity hover:opacity-90",
                )}
                style={{ backgroundColor: colors.text, color: colors.bg }}
              >
                <Video className="h-[9px] w-[9px]" />
                Join
              </a>
            </div>
          )}

          {/* Docs links (expanded only) */}
          {expanded && event.docsLinks && event.docsLinks.length > 0 && (
            <div className="mt-1 space-y-[2px]">
              {event.docsLinks.map(doc => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 text-[9px] underline decoration-dotted opacity-80 hover:opacity-100"
                >
                  <FileText className="h-[9px] w-[9px] flex-shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
