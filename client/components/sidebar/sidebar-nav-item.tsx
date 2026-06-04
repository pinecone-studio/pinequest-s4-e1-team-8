"use client";

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import type { sidebarNavItems } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import {
  Activity,
  CalendarDays,
  ChevronUp,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
} from "lucide-react";
import { usePathname } from "next/navigation";

type NavItem = (typeof sidebarNavItems)[number];

const navIcons = {
  Dashboard:       LayoutDashboard,
  "Project Board": LayoutGrid,
  Schedule:        CalendarDays,
  Activities:      Activity,
  Inbox:           Inbox,
} as const;

export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = item.href !== "#" && pathname === item.href;
  const Icon = navIcons[item.label as keyof typeof navIcons];

  return (
    <a
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
        isActive
          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
    >
      <Icon className="size-4 shrink-0" />

      <span className="min-w-0 flex-1">
        <span className="block leading-none">{item.label}</span>
        {"subtitle" in item && item.subtitle && (
          <span className="mt-0.5 block text-[11px] font-normal opacity-60">
            {item.subtitle}
          </span>
        )}
      </span>

      {/* Red dot — Dashboard */}
      {"dot" in item && item.dot && (
        <span className="size-2 shrink-0 rounded-full bg-rose-500" />
      )}

      {/* Chevron up — active expanded Project Board */}
      {isActive && (item.label as string) === "Project Board" && (
        <ChevronUp className="size-3.5 shrink-0 opacity-70" />
      )}

      {/* "New" badge — Activities */}
      {"badge" in item && item.badge === "New" && (
        <span className="shrink-0 rounded-md bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-400">
          New
        </span>
      )}

      {/* Numeric badge — Schedule */}
      {"badge" in item && typeof item.badge === "number" && (
        <span className="shrink-0 rounded-full bg-indigo-500/25 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
          {item.badge}
        </span>
      )}

      {/* Inbox count + avatar group */}
      {"count" in item && item.count && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">{item.count}</span>
          <AvatarGroup>
            <Avatar size="sm">
              <AvatarFallback className="bg-teal-500 text-[9px] font-bold text-white">A</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarFallback className="bg-amber-500 text-[9px] font-bold text-white">B</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarFallback className="bg-pink-500 text-[9px] font-bold text-white">C</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        </div>
      )}
    </a>
  );
}
