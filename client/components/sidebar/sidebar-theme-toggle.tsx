"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function SidebarThemeToggle() {
  const { collapsed } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent"
      >
        {isDark ? (
          <Moon className="size-4 stroke-[1.75]" />
        ) : (
          <Sun className="size-4 stroke-[1.75]" />
        )}
      </button>
    );
  }

  return (
    <div className="flex rounded-full bg-muted p-1">
      <button
        type="button"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-medium transition-colors",
          !isDark
            ? "bg-[#7c3aed] text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="size-3.5 stroke-[1.75]" />
        Light
      </button>
      <button
        type="button"
        aria-pressed={isDark}
        onClick={() => setTheme("dark")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-medium transition-colors",
          isDark
            ? "bg-[#7c3aed] text-white shadow-[0_2px_12px_-2px_rgba(124,58,237,0.5)]"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="size-3.5 stroke-[1.75]" />
        Dark
      </button>
    </div>
  );
}
