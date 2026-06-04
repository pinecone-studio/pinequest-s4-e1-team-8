import { CalendarSection } from "@/components/dashboard/calendar/calendar-section";
import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { DashboardSidebar } from "@/components/sidebar/sidebar";
import { TaskToolbar } from "@/components/dashboard/toolbar/task-toolbar";
import { LastProjectsWidget } from "@/components/dashboard/widgets/last-projects-widget";
import { TeamInsightsWidget } from "@/components/dashboard/widgets/team-insights-widget";

export function DashboardShell() {
  return (
    <div className="flex min-h-screen bg-[#121212]">
      <DashboardSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <CalendarSection />
        <TaskToolbar />
        <section className="grid gap-4 px-6 pt-2 pb-8 lg:grid-cols-2">
          <LastProjectsWidget />
          <TeamInsightsWidget />
        </section>
      </main>
    </div>
  );
}
