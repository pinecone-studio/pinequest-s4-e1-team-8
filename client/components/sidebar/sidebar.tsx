"use client";

import { SidebarAddProject } from "@/components/sidebar/sidebar-add-project";
import { SidebarAuth } from "@/components/sidebar/sidebar-auth";
import { SidebarCollapseTrigger } from "@/components/sidebar/sidebar-collapse-trigger";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/sidebar/sidebar-context";
import { SidebarNav } from "@/components/sidebar/sidebar-nav";
import { SidebarSearch } from "@/components/sidebar/sidebar-search";
import { SidebarThemeToggle } from "@/components/sidebar/sidebar-theme-toggle";
import { cn } from "@/lib/utils";
import { Bookmark, CreditCard, FileText, RefreshCw } from "lucide-react";

const utilityIcons = [
  { icon: FileText, label: "Documents" },
  { icon: RefreshCw, label: "Sync" },
  { icon: CreditCard, label: "Billing" },
  { icon: Bookmark, label: "Saved" },
] as const;

const DashboardSidebarInner = () => {
  const { collapsed } = useSidebar();

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 flex min-h-screen shrink-0 flex-col self-start overflow-hidden bg-[#121214] text-white transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[272px]",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center pt-5",
          collapsed ? "flex-col gap-2 px-2 pb-2" : "gap-2 px-3 pb-1",
        )}
      >
        <div className={cn(!collapsed && "min-w-0 flex-1")}>
          <SidebarAuth />
        </div>
        <SidebarCollapseTrigger className="shrink-0" />
      </div>

      <SidebarSearch />

      <div
        className={cn(
          "h-px bg-white/[0.06] transition-[margin] duration-300",
          collapsed ? "mx-3" : "mx-4",
        )}
      />

      <SidebarNav />

      <div
        className={cn(
          "mt-auto space-y-3 pb-5 transition-[padding] duration-300",
          collapsed ? "px-2" : "px-4",
        )}
      >
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b73]">
            Onboarding
          </p>
        )}

        <div
          className={cn(
            "rounded-2xl bg-[#1a1a1e]",
            collapsed
              ? "flex flex-col items-center gap-1 py-2"
              : "flex items-center gap-2 px-2 py-2",
          )}
        >
          <div
            className={cn(
              "flex items-center",
              collapsed ? "flex-col gap-1" : "flex-1 justify-between",
            )}
          >
            {utilityIcons.map(({ icon: Icon, label }, index) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={collapsed ? label : undefined}
                className={
                  index === 0
                    ? "flex size-8 items-center justify-center rounded-xl bg-white/[0.08] text-[#c4c4cc]"
                    : "flex size-8 items-center justify-center rounded-xl text-[#5c5c66] transition-colors hover:bg-white/[0.05] hover:text-[#9a9aa3]"
                }
              >
                <Icon className="size-[15px] stroke-[1.75]" />
              </button>
            ))}
          </div>
        </div>

        <SidebarThemeToggle />
        <SidebarAddProject />
      </div>
    </aside>
  );
};

export const DashboardSidebar = () => {
  return (
    <SidebarProvider>
      <DashboardSidebarInner />
    </SidebarProvider>
  );
};
