"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { cn } from "@/lib/utils";
import { Search, Star } from "lucide-react";

export function SidebarSearch() {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 pb-3 pt-2">
        <button
          type="button"
          aria-label="Search"
          title="Search"
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="size-[15px] stroke-[1.75]" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 size-[15px] -translate-y-1/2 text-muted-foreground stroke-[1.75]" />
        <input
          defaultValue="Redesign App"
          readOnly
          aria-label="Search"
          className={cn(
            "h-10 w-full rounded-full border-0 bg-muted pl-10 pr-10 text-[13px] text-muted-foreground",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40",
          )}
        />
        <Star className="absolute top-1/2 right-3.5 size-[14px] -translate-y-1/2 fill-[#fbbf24] text-[#fbbf24]" />
      </div>
    </div>
  );
}
