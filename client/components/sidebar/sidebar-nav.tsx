"use client";

import { MeetingSidebarSection } from "@/app/meeting/components/meeting-sidebar-section";
import { SidebarNavItem } from "@/components/sidebar/sidebar-nav-item";
import { SidebarTree } from "@/components/sidebar/sidebar-tree";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { sidebarNavItems, sidebarWorkflowItems } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

export const SidebarNav = () => {
  const { collapsed } = useSidebar();

  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto py-3 transition-[padding] duration-300",
        collapsed ? "px-2" : "px-3",
      )}
    >
      {!collapsed && (
        <p className="mb-2.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b73]">
          Overview
        </p>
      )}
      <ul className="space-y-0.5">
        {sidebarNavItems.map((item) => (
          <li key={item.label}>
            <SidebarNavItem item={item} />
            {!collapsed && "expandable" in item && item.expandable && (
              <SidebarTree />
            )}
          </li>
        ))}
        <Suspense fallback={null}>
          <MeetingSidebarSection />
        </Suspense>
      </ul>

      {!collapsed && (
        <p className="mb-2.5 mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b73]">
          Workflow
        </p>
      )}
      <ul className="space-y-0.5">
        {sidebarWorkflowItems.map((item) => (
          <li key={item.label}>
            <SidebarNavItem item={item} />
          </li>
        ))}
      </ul>
    </nav>
  );
};
