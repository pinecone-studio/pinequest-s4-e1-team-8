"use client";

import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

export function SidebarTree() {
  const { data, loaded, hasProject } = useOnboardingData();

  if (!loaded) {
    return null;
  }

  if (!hasProject || !data) {
    return (
      <div className="mt-1 px-3 py-2">
        <p className="text-[12px] text-[#6b6b73]">No projects yet.</p>
        <Link
          href="/onboarding"
          className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#a78bfa] hover:text-[#c4b5fd]"
        >
          <Plus className="size-3 shrink-0 stroke-[2]" />
          Set up project
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-0.5 pl-1">
      <ul className="space-y-0">
        <li>
          <a
            href="#"
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold text-[#a78bfa] transition-colors hover:bg-[#1a1a1e]",
            )}
          >
            <span className="size-2 shrink-0 rounded-full border-[1.5px] border-[#a78bfa]" />
            <span className="min-w-0 flex-1 truncate">{data.projectName}</span>
          </a>
        </li>
      </ul>

      <a
        href="#"
        className="mt-1 flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[12.5px] font-medium text-[#a78bfa] transition-colors hover:bg-[#1a1a1e] hover:text-[#c4b5fd]"
      >
        <Plus className="size-3 shrink-0 stroke-[2]" />
        Create New Board
      </a>
    </div>
  );
}
