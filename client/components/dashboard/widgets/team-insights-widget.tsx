import { ProgressRing } from "@/components/dashboard/shared/progress-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { chartBars, chartDays } from "@/lib/dashboard/data";

const legend = [
  { label: "Doing", color: "bg-violet-500" },
  { label: "Progress", color: "bg-sky-400" },
  { label: "Completed", color: "bg-emerald-400" },
] as const;

export function TeamInsightsWidget() {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pb-1">
        <div>
          <CardTitle className="text-base">Team Insights</CardTitle>
          <p className="text-xs text-emerald-500">+19,24</p>
        </div>
        <Button variant="link" size="sm" className="h-auto px-0 text-violet-500">
          View all
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 pb-4 md:grid-cols-2">
        <div className="space-y-3">
          <ProgressRing
            label="Time Spent"
            display="9h"
            value={75}
            colorClass="text-violet-500"
          />
          <ProgressRing
            label="Tasks"
            display="10"
            value={68}
            colorClass="text-sky-400"
          />
          <div className="flex flex-wrap gap-3">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${item.color}`} />
                <Label className="text-[11px] font-normal text-muted-foreground">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <ActivityChart />
      </CardContent>
    </Card>
  );
}

function ActivityChart() {
  return (
    <div className="flex items-end justify-between gap-1 pt-1">
      {chartBars.map((bar, index) => (
        <div key={`chart-day-${index}`} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-16 w-full flex-col-reverse overflow-hidden rounded-lg">
            <div className="bg-emerald-400" style={{ height: `${bar.completed}%` }} />
            <div className="bg-sky-400" style={{ height: `${bar.progress}%` }} />
            <div className="bg-violet-500" style={{ height: `${bar.doing}%` }} />
          </div>
          <Label className="text-[10px] font-normal text-muted-foreground">
            {chartDays[index]}
          </Label>
        </div>
      ))}
    </div>
  );
}
