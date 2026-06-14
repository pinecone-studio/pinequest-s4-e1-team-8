import { AgendaPanel } from "@/components/home/agenda-panel";
import { CalendarWidget } from "@/components/home/calendar-widget";

export function ScheduleSidebar() {
  return (
    <aside className="relative z-10 hidden h-full w-[30%] shrink-0 flex-col gap-6 overflow-y-auto px-6 py-4 scrollbar-none lg:py-6 xl:flex">
      <CalendarWidget />
      <AgendaPanel />
    </aside>
  );
}
