"use client";

import { ActiveMeetingReturnCard } from "@/app/meeting/components/active-meeting-return-card";
import { SidebarAddProject } from "@/components/sidebar/sidebar-add-project";
import { SidebarAuth } from "@/components/sidebar/sidebar-auth";
import { MobileSidebarTrigger } from "@/components/sidebar/mobile-sidebar-trigger";
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
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <>
      {!collapsed ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      ) : null}
    <aside
      data-collapsed={collapsed}
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex min-h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-[width,transform] duration-300 ease-in-out md:sticky md:top-0 md:self-start md:shadow-none",
        collapsed
          ? "w-[272px] -translate-x-full md:w-[72px] md:translate-x-0"
          : "w-[272px] translate-x-0",
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
          "h-px bg-sidebar-border transition-[margin] duration-300",
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
        <ActiveMeetingReturnCard />

        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Onboarding
          </p>
        )}

        <div
          className={cn(
            "rounded-2xl bg-sidebar-accent",
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
                    ? "flex size-8 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground"
                    : "flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
    </>
  );
};

export const DashboardSidebar = () => {
  return (
    <SidebarProvider>
      <DashboardSidebarInner />
      <MobileSidebarTrigger />
    </SidebarProvider>
  );
};
