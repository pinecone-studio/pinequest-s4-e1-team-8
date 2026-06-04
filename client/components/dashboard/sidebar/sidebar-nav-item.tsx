import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { sidebarNavItems } from "@/lib/dashboard/data";
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
  const isActive = "active" in item && item.active;
  const Icon = navIcons[item.label as keyof typeof navIcons];

  return (
    <a
      href={item.href}
        className={cn(
          "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-violet-600 font-medium text-white shadow-lg shadow-violet-600/20"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="size-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">
          <span className="block">{item.label}</span>
          {"subtitle" in item && item.subtitle && (
            <span className="block text-[11px] font-normal opacity-70">
              {item.subtitle}
            </span>
          )}
        </span>
        {"dot" in item && item.dot && (
          <span className="size-2 rounded-full bg-rose-500" />
        )}
        {"badge" in item && item.badge && (
          <Badge
            className={
              isActive
                ? "bg-white/15 text-[10px] text-white hover:bg-white/15"
                : "bg-violet-500/15 text-[10px] text-violet-500"
            }
          >
            {item.badge}
          </Badge>
        )}
        {"count" in item && item.count && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs font-medium">{item.count}</span>
            <AvatarGroup>
              <Avatar size="sm">
                <AvatarFallback className="bg-sky-500 text-[10px] text-white">
                  A
                </AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback className="bg-pink-500 text-[10px] text-white">
                  B
                </AvatarFallback>
              </Avatar>
            </AvatarGroup>
          </div>
        )}
      </a>
  );
}
