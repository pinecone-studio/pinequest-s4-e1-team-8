"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import type { sidebarNavItems, sidebarWorkflowItems } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  CalendarDays,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem =
  | (typeof sidebarNavItems)[number]
  | (typeof sidebarWorkflowItems)[number]
  | { label: "Meeting Summaries"; href: "/meeting-summaries" };

const navIcons = {
  Dashboard: LayoutDashboard,
  Tasks: ListTodo,
  Analytics: BarChart3,
  "Meeting Summaries": FileText,
  "Project Board": LayoutGrid,
  Schedule: CalendarDays,
  Activities: Activity,
  Inbox: Inbox,
  Workflow: Sparkles,
} as const;

export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isActive = item.href !== "#" && pathname === item.href;
  const Icon = navIcons[item.label as keyof typeof navIcons];
  const hasDot = "dot" in item && item.dot;

  const className = cn(
        "relative flex items-center rounded-[14px] text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5",
        isActive
          ? "bg-[#7c3aed] text-white shadow-[0_4px_24px_-4px_rgba(124,58,237,0.55)]"
          : "text-[#8e8e93] hover:bg-white/[0.04] hover:text-[#c4c4cc]",
  );

  const content = (
    <>
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
          </span>

          {hasDot ? (
            <span className="size-2 shrink-0 rounded-full bg-[#ef4444]" />
          ) : null}
        </>
      )}

      {collapsed && hasDot ? (
        <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#ef4444]" />
      ) : null}
    </>
  );

  if (item.href === "#") {
    return (
      <span title={collapsed ? item.label : undefined} className={className}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}
