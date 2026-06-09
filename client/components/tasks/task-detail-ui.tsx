import { cn } from "@/lib/utils";

export function PropertyRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[120px_1fr] items-center gap-x-10 gap-y-1 py-3.5", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  );
}

export function PillBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

export const detailFieldClass =
  "rounded-lg border border-border/60 bg-muted text-sm outline-none transition-colors focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20";

export const detailInputClass = cn(detailFieldClass, "h-9 px-3");

export const detailSelectClass = cn(detailInputClass, "appearance-none pr-8");

export const detailTextareaClass = cn(
  detailFieldClass,
  "min-h-28 w-full resize-y px-3 py-2 leading-relaxed placeholder:text-muted-foreground",
);

export const detailTitleClass = cn(
  detailFieldClass,
  "mb-8 w-full px-4 py-3 text-[1.75rem] font-semibold leading-tight tracking-tight placeholder:text-muted-foreground",
);
