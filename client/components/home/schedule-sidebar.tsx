import { AgendaPanel } from "@/components/home/agenda-panel";
import { CalendarWidget } from "@/components/home/calendar-widget";

export function ScheduleSidebar() {
  return (
    <aside className="hidden h-full w-[28%] shrink-0 flex-col gap-6 overflow-y-auto border-l border-zinc-100 bg-white/50 p-6 xl:flex dark:border-border dark:bg-card/50">
      <CalendarWidget />
      <AgendaPanel />
    </aside>
  );
}
