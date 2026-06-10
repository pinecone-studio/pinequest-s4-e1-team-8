import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { TrendingUp } from "lucide-react";

export default function ProgressPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader />
      <section className="flex flex-1 flex-col px-6 py-4">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 py-24 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
            <TrendingUp className="size-6" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Progress</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              This page is being rebuilt from scratch. The new design lands here soon.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
