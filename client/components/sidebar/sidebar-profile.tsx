"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Plus, Settings } from "lucide-react";

export function SidebarProfile() {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return (
      <Avatar size="lg" className="size-9 after:border-0" title="Walter">
        <AvatarFallback className="bg-[#7c3aed] text-sm font-semibold text-foreground">
          W
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 px-1">
      <Avatar size="lg" className="size-10 shrink-0 after:border-0">
        <AvatarFallback className="bg-[#7c3aed] text-sm font-semibold text-foreground">
          W
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight text-sidebar-foreground">
          Walter
        </p>
        <p className="truncate text-[11px] font-medium text-[#a78bfa]">
          Designer Pro+
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          aria-label="Add"
          className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-4 stroke-[1.75]" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className={cn(
            "flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
          )}
        >
          <Settings className="size-4 stroke-[1.75]" />
        </button>
      </div>
    </div>
  );
}
