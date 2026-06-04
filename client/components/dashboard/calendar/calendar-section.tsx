"use client";

import { CalendarControls } from "@/components/dashboard/calendar/calendar-controls";
import { CalendarGrid } from "@/components/dashboard/calendar/calendar-grid";

export function CalendarSection() {
  return (
    <section className="flex flex-col gap-2 overflow-x-auto px-6 py-2">
      <CalendarControls />
      <CalendarGrid />
    </section>
  );
}
