"use client";

import { useRef } from "react";
import type { CalendarEvent } from "@/lib/dashboard/calendar-types";
import { EVENT_COLORS } from "@/lib/dashboard/calendar-types";
import { cn } from "@/lib/utils";
import { Video, Check } from "lucide-react";

interface EventCardProps {
  event:       CalendarEvent;
  isDragging:  boolean;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDragEnd:   () => void;
  onEdit:      (e: React.MouseEvent, event: CalendarEvent) => void;
}

export function EventCard({ event, isDragging, onDragStart, onDragEnd, onEdit }: EventCardProps) {
  const colors = EVENT_COLORS[event.color];
  const layout = event._layout!;

  const isTiny    = layout.heightPx < 32;
  const isCompact = layout.heightPx < 52;
  const isSmall   = layout.heightPx < 84;
  const isMedium  = layout.heightPx < 120;

  const start = new Date(event.startUnix);
  const end   = new Date(event.endUnix);
  const fmt   = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const timeLabel = `${fmt(start)} – ${fmt(end)}`;

  // Suppress click when the user just finished dragging
  const didDragRef = useRef(false);

  return (
    <div
      data-event-card
      draggable
      onDragStart={e => {
        didDragRef.current = false;
        onDragStart(e, event);
      }}
      onDragEnd={() => {
        didDragRef.current = true;
        onDragEnd();
        setTimeout(() => { didDragRef.current = false; }, 200);
      }}
      onClick={e => {
        if (didDragRef.current) return;
        e.stopPropagation();
        onEdit(e, event);
      }}
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
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-70"
        style={{ backgroundColor: colors.accent }}
      />

      {isTiny ? (
        <p className="truncate pl-[6px] pr-[4px] text-[10px] font-semibold leading-[30px]">
          {event.title}
        </p>
      ) : isCompact ? (
        <div className="flex items-baseline gap-[4px] pl-[8px] pr-[5px] py-[4px]">
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight">
            {event.title}
          </p>
          <span className="shrink-0 whitespace-nowrap text-[9px] tabular-nums opacity-70">
            {fmt(start)}
          </span>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-[2px] overflow-hidden pl-[8px] pr-[6px] py-[6px] leading-tight">
          <p className="truncate text-[12px] font-semibold">{event.title}</p>
          <p className="text-[10px] tabular-nums opacity-75">{timeLabel}</p>

          {!isSmall && !isMedium && event.attendees && event.attendees.length > 0 && (
            <div className="mt-[4px] flex items-center gap-[2px]">
              {event.attendees.slice(0, 4).map(att => (
                <span
                  key={att.email}
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white ring-[1.5px] ring-black/20"
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

          {!isMedium && event.checklistItems && event.checklistItems.length > 0 && (
            <ul className="mt-[3px] min-h-0 flex-1 space-y-[2px] overflow-hidden">
              {event.checklistItems.slice(0, 4).map(item => (
                <li key={item.id} className="flex items-center gap-1 text-[9px]">
                  <span
                    className={cn(
                      "flex h-3 w-3 shrink-0 items-center justify-center rounded-[2px] border",
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

          {!isSmall && event.meetUrl && (
            <div className="mt-auto flex items-center justify-between gap-1 pt-[2px]">
              <span className="truncate text-[9px] opacity-60 decoration-dotted underline">
                {event.meetUrl.replace(/^https?:\/\//, "")}
              </span>
              <a
                href={event.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className={cn(
                  "flex shrink-0 items-center gap-[3px] rounded-full px-[7px] py-[2px]",
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
        </div>
      )}
    </div>
  );
}
