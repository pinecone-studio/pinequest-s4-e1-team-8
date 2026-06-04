"use client";

import { SidebarNavItem } from "@/components/sidebar/sidebar-nav-item";
import { SidebarTree } from "@/components/sidebar/sidebar-tree";
import { sidebarNavItems } from "@/lib/dashboard/data";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Overview
      </p>
      <ul className="space-y-0.5">
        {sidebarNavItems.map((item) => {
          const isProjectBoard = item.label === "Project Board";
          const isActive = item.href !== "#" && pathname === item.href;

          return (
            <li key={item.label}>
              <SidebarNavItem item={item} />
              {isProjectBoard && (isActive || item.href === "#") && <SidebarTree />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
