"use client";

import { useState, useEffect, useRef } from "react";
import { Video, X } from "lucide-react";
import { snapTo15Minutes } from "@/lib/dashboard/calendar-engine";

interface CreateEventPopoverProps {
  startUnix: number;
  pos:       { x: number; y: number };
  onCreate:  (data: { title: string; startUnix: number; endUnix: number; addMeet: boolean }) => void;
  onClose:   () => void;
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

export function CreateEventPopover({ startUnix, pos, onCreate, onClose }: CreateEventPopoverProps) {
  const snapped    = snapTo15Minutes(startUnix);
  const [title,    setTitle]    = useState('');
  const [startStr, setStartStr] = useState(() => toDatetimeLocal(snapped));
  const [endStr,   setEndStr]   = useState(() => toDatetimeLocal(snapped + 60 * 60 * 1000));
  const [addMeet,  setAddMeet]  = useState(false);
  const ref      = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent)  { if (e.key === 'Escape') onClose(); }
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
  const top  = Math.min(pos.y - 8, window.innerHeight - 400);

  function handleCreate() {
    if (!title.trim()) return;
    onCreate({
      title:     title.trim(),
      startUnix: new Date(startStr).getTime(),
      endUnix:   new Date(endStr).getTime(),
      addMeet,
    });
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
          New Event
        </span>
        <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>

      {/* Title */}
      <div className="mb-2">
        <label className="mb-1 block text-[10px] text-muted-foreground">Title</label>
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Event title"
          className={`${INPUT_CLS} placeholder-[#3a4050]`}
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

      {/* Google Meet toggle */}
      <button
        onClick={() => setAddMeet(v => !v)}
        className={`mb-3 flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
          addMeet
            ? 'border-[#2563eb]/50 bg-[#2563eb]/15 text-[#3b82f6]'
            : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
        }`}
      >
        <Video className="size-3.5" />
        {addMeet ? 'Google Meet will be added' : 'Add Google Meet'}
      </button>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!title.trim()}
          className="ml-auto rounded-lg bg-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_12px_rgba(37,99,235,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create
        </button>
      </div>
    </div>
  );
}
