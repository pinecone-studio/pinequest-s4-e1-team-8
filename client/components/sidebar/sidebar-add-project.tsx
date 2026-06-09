"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Plus } from "lucide-react";

export function SidebarAddProject() {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label="Add new project"
        title="Add new project"
        className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#7c3aed] text-white shadow-[0_4px_20px_-4px_rgba(124,58,237,0.6)] transition-colors hover:bg-[#6d28d9]"
      >
        <Plus className="size-[18px] stroke-[2]" />
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-white/[0.12] bg-transparent px-4 py-5 text-center">
      <button
        type="button"
        aria-label="Add new project"
        className="mx-auto mb-2.5 flex size-9 items-center justify-center rounded-full bg-[#7c3aed] text-white shadow-[0_4px_20px_-4px_rgba(124,58,237,0.6)] transition-colors hover:bg-[#6d28d9]"
      >
        <Plus className="size-[18px] stroke-[2]" />
      </button>
      <p className="text-[13px] font-semibold text-white">Add New Project</p>
      <p className="mt-1 text-[11px] text-[#6b6b73]">
        Or use{" "}
        <a
          href="/onboarding"
          className="font-medium text-[#a78bfa] underline underline-offset-2 hover:text-[#c4b5fd]"
        >
          new project
        </a>
      </p>
    </div>
  );
}
