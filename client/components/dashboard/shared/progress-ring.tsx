import { Label } from "@/components/ui/label";

export function ProgressRing({
  label,
  value,
  display,
  colorClass,
}: {
  label: string;
  value: number;
  display: string;
  colorClass: string;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <svg className="size-11 -rotate-90" viewBox="0 0 40 40" aria-hidden>
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth="3.5"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={colorClass}
        />
      </svg>
      <div>
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{display}</span>
          <span className="text-xs text-muted-foreground">{value}%</span>
        </div>
      </div>
    </div>
  );
}
