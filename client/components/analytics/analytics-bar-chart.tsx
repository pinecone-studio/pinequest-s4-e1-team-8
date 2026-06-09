import { cn } from "@/lib/utils";

export type ChartBarItem = {
  label: string;
  value: number;
  gradient: string;
  glow: string;
};

export function AnalyticsBarChart({
  title,
  items,
  columns = 3,
}: {
  title: string;
  items: ChartBarItem[];
  columns?: number;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-lg border border-border/60 bg-secondary p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>

      <div
        className="mt-3 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const ratio = item.value / max;
          const barHeight =
            item.value === 0
              ? 3
              : Math.max(Math.round(ratio * 72), 10);

          return (
            <div key={item.label} className="flex flex-col items-center">
              <span className="mb-1 text-xs font-semibold tabular-nums text-foreground">
                {item.value}
              </span>

              <div className="relative flex h-20 w-full items-end justify-center">
                <div className="absolute inset-x-2 bottom-0 h-px bg-border/50" />
                <div
                  className={cn(
                    "relative w-7 rounded-full bg-gradient-to-t shadow-md transition-all duration-500",
                    item.gradient,
                    item.glow,
                  )}
                  style={{ height: barHeight }}
                />
              </div>

              <span className="mt-2 text-[11px] font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
