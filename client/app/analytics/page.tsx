import { AnalyticsPanels } from "@/components/analytics/analytics-panels";
import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";

export default function AnalyticsPage() {
  return (
    <>
      <DashboardHeader />
      <section className="flex flex-1 flex-col gap-5 px-6 py-6">
        <AnalyticsPanels />
      </section>
    </>
  );
}
