import { AnalyticsMetrics } from "@/components/analytics/analytics-metrics";
import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";

export default function AnalyticsPage() {
  return (
    <>
      <DashboardHeader />
      <section className="flex flex-1 flex-col gap-5 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-violet-400">Team Project</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Analytics
            </h1>
          </div>
        </div>
        <AnalyticsMetrics />
      </section>
    </>
  );
}
