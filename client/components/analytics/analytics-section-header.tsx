import type { ReactNode } from "react";

export function AnalyticsSectionHeader({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="grid size-6 place-items-center rounded-md bg-violet-100 dark:bg-violet-500/15">
        {icon}
      </div>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    </div>
  );
}
