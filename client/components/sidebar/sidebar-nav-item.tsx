"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import type { sidebarNavItems } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import {
  Activity,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
} from "lucide-react";
import { usePathname } from "next/navigation";

type NavItem = (typeof sidebarNavItems)[number];

const navIcons = {
  Dashboard: LayoutDashboard,
  Tasks: ListTodo,
  "Project Board": LayoutGrid,
  Schedule: CalendarDays,
  Activities: Activity,
  Inbox: Inbox,
} as const;

export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isActive = item.href !== "#" && pathname === item.href;
  const isEmphasized = "emphasized" in item && item.emphasized;
  const Icon = navIcons[item.label as keyof typeof navIcons];
  const hasDot = "dot" in item && item.dot;
  const hasNewBadge = "badge" in item && item.badge === "New";
  const hasNumericBadge = "badge" in item && typeof item.badge === "number";

  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center rounded-[14px] text-[13px] font-medium transition-colors",
        collapsed
          ? "justify-center px-0 py-2.5"
          : "gap-2.5 px-3 py-2.5",
        isActive
          ? "bg-[#7c3aed] text-white shadow-[0_4px_24px_-4px_rgba(124,58,237,0.55)]"
          : isEmphasized
            ? "text-white hover:bg-white/[0.04]"
            : "text-[#8e8e93] hover:bg-white/[0.04] hover:text-[#c4c4cc]",
      )}
    >
      <Icon
        className={cn(
          "shrink-0 stroke-[1.75]",
          collapsed ? "size-[18px]" : "size-[17px]",
          isActive ? "text-white" : "text-[#6b6b73]",
        )}
      />

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block leading-tight">{item.label}</span>
            {"subtitle" in item && item.subtitle && (
              <span className="mt-0.5 block text-[11px] font-normal text-[#6b6b73]">
                {item.subtitle}
              </span>
            )}
          </span>

          {hasDot && (
            <span className="size-2 shrink-0 rounded-full bg-[#ef4444]" />
          )}

          {hasNewBadge && (
            <span className="shrink-0 rounded-md bg-[#0d9488]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#2dd4bf]">
              New
            </span>
          )}

          {hasNumericBadge && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#4c1d95]/80 text-[10px] font-semibold text-[#c4b5fd]">
              {item.badge}
            </span>
          )}

          {"count" in item && item.count && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12px] font-semibold text-white">
                {item.count}
              </span>
              <AvatarGroup className="-space-x-1.5">
                <Avatar size="sm" className="size-5 ring-2 ring-[#121214]">
                  <AvatarFallback className="bg-[#14b8a6] text-[8px] font-bold text-white">
                    A
                  </AvatarFallback>
                </Avatar>
                <Avatar size="sm" className="size-5 ring-2 ring-[#121214]">
                  <AvatarFallback className="bg-[#f97316] text-[8px] font-bold text-white">
                    E
                  </AvatarFallback>
                </Avatar>
                <Avatar size="sm" className="size-5 ring-2 ring-[#121214]">
                  <AvatarFallback className="bg-[#ec4899] text-[8px] font-bold text-white">
                    C
                  </AvatarFallback>
                </Avatar>
              </AvatarGroup>
            </div>
          )}
        </>
      )}

      {collapsed && hasDot && (
        <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#ef4444]" />
      )}
      {collapsed && hasNumericBadge && (
        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[#4c1d95] text-[8px] font-semibold text-[#c4b5fd]">
          {item.badge}
        </span>
      )}
      {collapsed && hasNewBadge && (
        <span className="absolute top-2 right-1 size-1.5 rounded-full bg-[#2dd4bf]" />
      )}
    </a>
  );
}
