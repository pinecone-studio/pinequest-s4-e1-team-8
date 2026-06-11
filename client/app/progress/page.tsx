import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { ProgressTimeline } from "@/components/progress/progress-timeline";

export default function ProgressPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader />
      <section className="flex flex-1 flex-col px-6 py-4">
        <ProgressTimeline />
      </section>
    </div>
  );
}
