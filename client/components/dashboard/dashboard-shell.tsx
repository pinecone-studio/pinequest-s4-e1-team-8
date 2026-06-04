import { CalendarSection } from "@/components/dashboard/calendar/calendar-section";
import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { TaskToolbar } from "@/components/dashboard/toolbar/task-toolbar";
import { LastProjectsWidget } from "@/components/dashboard/widgets/last-projects-widget";
import { TeamInsightsWidget } from "@/components/dashboard/widgets/team-insights-widget";

export function DashboardShell() {
  return (
    <>
      <DashboardHeader />
      <CalendarSection />
      <TaskToolbar />
      <section className="grid gap-4 px-6 pt-2 pb-8 lg:grid-cols-2">
        <LastProjectsWidget />
        <TeamInsightsWidget />
      </section>
    </>
  );
}
