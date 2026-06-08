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

export const detailSelectClass =
  "h-8 rounded-md border-0 bg-transparent px-0 text-sm outline-none focus:ring-0";

export const detailTextareaClass =
  "mt-4 min-h-28 w-full resize-none rounded-md border-0 bg-transparent px-0 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-0";

export const detailTitleClass =
  "mb-8 w-full border-0 bg-transparent text-[1.75rem] font-semibold leading-tight tracking-tight outline-none placeholder:text-muted-foreground";
