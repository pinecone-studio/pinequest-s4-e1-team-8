"use client";

import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function SidebarTree() {
  const { data, loaded, hasProject } = useOnboardingData();

  if (!loaded) {
    return null;
  }

  if (!hasProject || !data) {
    return (
      <div className="ml-3 border-l border-border/40 pl-3 py-1">
        <p className="px-2 py-1.5 text-[12px] text-muted-foreground">
          No projects yet.
        </p>
        <Link
          href="/onboarding"
          className="block px-2 py-1.5 text-[12px] text-violet-700 dark:text-violet-500 hover:text-violet-800 dark:hover:text-violet-400"
        >
          Set up project
        </Link>
      </div>
    );
  }

  return (
    <ul className="ml-3 space-y-0.5 border-l border-border/40 pl-3">
      <li>
        <a
          href="#"
          className={cn(
            "flex items-center gap-1.5 rounded-xl py-1.5 pl-1 text-[13px] font-medium text-violet-600 transition-colors hover:bg-sidebar-accent dark:text-violet-300",
          )}
        >
          <ChevronRight className="size-3.5 shrink-0 opacity-40" />
          {data.projectName}
        </a>
      </li>
    </ul>
  );
}
