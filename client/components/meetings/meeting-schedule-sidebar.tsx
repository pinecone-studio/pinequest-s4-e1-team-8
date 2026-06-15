import { AgendaPanel } from "@/components/home/agenda-panel";
import { CalendarWidget } from "@/components/home/calendar-widget";
import { GoogleAgendaProvider } from "@/lib/home/google-agenda-context";

export function MeetingScheduleSidebar() {
  return (
    <GoogleAgendaProvider>
      <aside className="relative z-10 hidden h-full w-80 shrink-0 flex-col gap-6 overflow-x-visible overflow-y-auto border-l border-border bg-card/40 p-6 backdrop-blur-sm scrollbar-none xl:flex">
        <CalendarWidget />
        <AgendaPanel />
      </aside>
    </GoogleAgendaProvider>
  );
}
