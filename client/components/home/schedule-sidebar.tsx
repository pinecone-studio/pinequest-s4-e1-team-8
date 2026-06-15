import { AgendaPanel } from "@/components/home/agenda-panel";
import { CalendarWidget } from "@/components/home/calendar-widget";
import { GoogleAgendaProvider } from "@/lib/home/google-agenda-context";

export function ScheduleSidebar() {
  return (
    <GoogleAgendaProvider>
      <aside className="relative z-10 hidden h-full w-full shrink-0 flex-col gap-6 overflow-x-visible overflow-y-auto border-t border-border px-6 py-4 scrollbar-none lg:flex lg:w-[30%] lg:border-t-0 lg:py-6">
        <CalendarWidget />
        <AgendaPanel />
      </aside>
    </GoogleAgendaProvider>
  );
}
