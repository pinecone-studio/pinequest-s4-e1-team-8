import { cn } from "@/lib/utils";

type CircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
};

export const CircularProgress = ({
  value,
  size = 40,
  strokeWidth = 4,
  className,
  trackClassName,
  indicatorClassName,
  showLabel = true,
}: CircularProgressProps) => {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("stroke-primary transition-all duration-300 ease-out", indicatorClassName)}
        />
      </svg>
      {showLabel ? (
        <span className="absolute text-[10px] font-semibold text-foreground">{Math.round(clamped)}%</span>
      ) : null}
    </div>
  );
};
