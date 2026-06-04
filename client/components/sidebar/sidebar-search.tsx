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
          className="flex size-10 items-center justify-center rounded-full bg-[#1a1a1e] text-[#5c5c66] transition-colors hover:bg-[#222228] hover:text-[#9a9aa3]"
        >
          <Search className="size-[15px] stroke-[1.75]" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 size-[15px] -translate-y-1/2 text-[#5c5c66] stroke-[1.75]" />
        <input
          defaultValue="Redesign App"
          readOnly
          aria-label="Search"
          className={cn(
            "h-10 w-full rounded-full border-0 bg-[#1a1a1e] pl-10 pr-10 text-[13px] text-[#a1a1aa]",
            "placeholder:text-[#5c5c66] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40",
          )}
        />
        <Star className="absolute top-1/2 right-3.5 size-[14px] -translate-y-1/2 fill-[#fbbf24] text-[#fbbf24]" />
      </div>
    </div>
  );
}
