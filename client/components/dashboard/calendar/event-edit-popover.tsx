"use client";

import { useState, useEffect, useRef } from "react";
import type { CalendarEvent } from "@/lib/dashboard/calendar-types";
import { Video, Trash2, X, Plus } from "lucide-react";

interface EventEditPopoverProps {
  event:    CalendarEvent;
  pos:      { x: number; y: number };
  onSave:   (eventId: string, patch: { title?: string; startUnix?: number; endUnix?: number; addMeet?: boolean }) => void;
  onDelete: (eventId: string) => void;
  onClose:  () => void;
}

function toDatetimeLocal(unixMs: number): string {
  const d = new Date(unixMs);
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, '0')}-` +
    `${String(d.getDate()).padStart(2, '0')}T` +
    `${String(d.getHours()).padStart(2, '0')}:` +
    `${String(d.getMinutes()).padStart(2, '0')}`
  );
}

const INPUT_CLS =
  "w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground " +
  "outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/40 ";

export function EventEditPopover({ event, pos, onSave, onDelete, onClose }: EventEditPopoverProps) {
  const [title,    setTitle]    = useState(event.title);
  const [startStr, setStartStr] = useState(() => toDatetimeLocal(event.startUnix));
  const [endStr,   setEndStr]   = useState(() => toDatetimeLocal(event.endUnix));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent)   { if (e.key === 'Escape') onClose(); }
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const PANEL_W = 288;
  const left = pos.x + PANEL_W + 20 > window.innerWidth ? pos.x - PANEL_W - 8 : pos.x + 8;
  const top  = Math.min(pos.y - 8, window.innerHeight - 380);

  function handleSave() {
    const patch: { title?: string; startUnix?: number; endUnix?: number } = {};
    if (title.trim() !== event.title)               patch.title     = title.trim();
    const s = new Date(startStr).getTime();
    const e2 = new Date(endStr).getTime();
    if (s !== event.startUnix)                       patch.startUnix = s;
    if (e2 !== event.endUnix)                        patch.endUnix   = e2;
    onSave(event.id, patch);
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 rounded-2xl border border-border bg-popover p-4 shadow-2xl"
      style={{ left, top }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Edit Event
        </span>
        <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>

      {/* Title */}
      <div className="mb-2">
        <label className="mb-1 block text-[10px] text-muted-foreground">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className={INPUT_CLS}
        />
      </div>

      {/* Start */}
      <div className="mb-2">
        <label className="mb-1 block text-[10px] text-muted-foreground">Start</label>
        <input
          type="datetime-local"
          value={startStr}
          onChange={e => setStartStr(e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      {/* End */}
      <div className="mb-3">
        <label className="mb-1 block text-[10px] text-muted-foreground">End</label>
        <input
          type="datetime-local"
          value={endStr}
          onChange={e => setEndStr(e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      {/* Meet */}
      {event.meetUrl ? (
        <a
          href={event.meetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-[#3b82f6] transition-colors hover:text-blue-400"
        >
          <Video className="size-3.5 shrink-0" />
          <span className="truncate">{event.meetUrl.replace(/^https?:\/\//, '')}</span>
        </a>
      ) : (
        <button
          onClick={() => onSave(event.id, { addMeet: true })}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add Google Meet
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDelete(event.id)}
          className="flex items-center gap-1.5 rounded-lg border border-[#be185d]/30 bg-[#be185d]/10 px-3 py-1.5 text-xs text-[#ec4899] transition-colors hover:bg-[#be185d]/20"
        >
          <Trash2 className="size-3" />
          Delete
        </button>
        <button
          onClick={handleSave}
          className="ml-auto rounded-lg bg-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_12px_rgba(37,99,235,0.35)] transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>
  );
}
