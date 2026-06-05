"use client";

import { CalendarResizeHandle } from "./calendar-resize-handle";

export function CalendarResizableShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="group/calendar-resize relative w-full">
      {children}
      <CalendarResizeHandle />
    </div>
  );
}
