import { CalendarSection } from "@/components/dashboard/calendar/calendar-section";
import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { DashboardWidgetsSection } from "@/components/dashboard/widgets/dashboard-widgets-section";

export function DashboardShell() {
  return (
    <>
      <DashboardHeader />
      <CalendarSection />
      <DashboardWidgetsSection />
    </>
  );
}
