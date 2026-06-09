"use client";

import { SidebarNavItem } from "@/components/dashboard/sidebar/sidebar-nav-item";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sidebarNavItems } from "@/lib/dashboard/data";
import { Plus } from "lucide-react";

export function SidebarNav() {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3">
      <div>
        <Label className="mb-2 block px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Overview
        </Label>
        <ul className="space-y-1">
          {sidebarNavItems.map((item) => (
            <li key={item.label}>
              <SidebarNavItem item={item} />
            </li>
          ))}
        </ul>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-4" />
        Create New Board
      </Button>
    </nav>
  );
}
