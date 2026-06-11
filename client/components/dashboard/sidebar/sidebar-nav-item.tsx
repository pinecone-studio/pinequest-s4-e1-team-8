import type { sidebarNavItems } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Sparkles,
} from "lucide-react";

type NavItem = (typeof sidebarNavItems)[number];

const navIcons = {
  Dashboard: LayoutDashboard,
  "Project Board": LayoutGrid,
  Schedule: CalendarDays,
  Activities: Sparkles,
  Inbox: Inbox,
} as const;

export function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon = navIcons[item.label as keyof typeof navIcons];

  return (
    <a
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      <span className="min-w-0 flex-1">
        <span className="block">{item.label}</span>
      </span>
      {"dot" in item && item.dot ? (
        <span className="size-2 rounded-full bg-rose-500" />
      ) : null}
    </a>
  );
}
