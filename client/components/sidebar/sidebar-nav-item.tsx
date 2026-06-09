"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import type { sidebarNavItems, sidebarWorkflowItems } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  ListTodo,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem =
  | (typeof sidebarNavItems)[number]
  | (typeof sidebarWorkflowItems)[number];

const navIconsByHref = {
  "/dashboard": LayoutDashboard,
  "/tasks": ListTodo,
  "/analytics": BarChart3,
  "/meeting-summaries": FileText,
  "/workflow": Sparkles,
} as const;

export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isActive = item.href !== "#" && pathname === item.href;
  const Icon =
    navIconsByHref[item.href as keyof typeof navIconsByHref] ?? LayoutDashboard;
  const hasDot = "dot" in item && item.dot;

  const className = cn(
        "relative flex items-center rounded-[14px] text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5",
        isActive
          ? "bg-[#7c3aed] text-white shadow-[0_4px_24px_-4px_rgba(124,58,237,0.55)]"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

  const content = (
    <>
      <Icon
        className={cn(
          "shrink-0 stroke-[1.75]",
          collapsed ? "size-[18px]" : "size-[17px]",
          isActive ? "text-white" : "text-muted-foreground",
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
