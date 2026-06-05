"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <div className="flex rounded-full border border-sidebar-border bg-background/60 p-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
        className={`flex-1 gap-1 rounded-full ${!isDark ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"}`}
      >
        <Sun className="size-3.5" />
        Light
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={isDark}
        onClick={() => setTheme("dark")}
        className={`flex-1 gap-1 rounded-full ${isDark ? "bg-violet-600 text-white hover:bg-violet-600 hover:text-white" : "text-muted-foreground"}`}
      >
        <Moon className="size-3.5" />
        Dark
      </Button>
    </div>
  );
}
