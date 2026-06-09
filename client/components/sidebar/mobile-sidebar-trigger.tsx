"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function MobileSidebarTrigger() {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-30 rounded-xl md:hidden"
      aria-label="Open navigation"
      onClick={() => setCollapsed(false)}
    >
      <Menu className="size-5" />
      <span className="sr-only">{collapsed ? "Open menu" : "Menu open"}</span>
    </Button>
  );
}
