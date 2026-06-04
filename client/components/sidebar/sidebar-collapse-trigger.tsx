"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SidebarCollapseTrigger({ className }: { className?: string }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg text-[#8e8e93] transition-colors hover:bg-white/[0.06] hover:text-white",
        className,
      )}
    >
      {collapsed ? (
        <ChevronRight className="size-4 stroke-[1.75]" />
      ) : (
        <ChevronLeft className="size-4 stroke-[1.75]" />
      )}
    </button>
  );
}
