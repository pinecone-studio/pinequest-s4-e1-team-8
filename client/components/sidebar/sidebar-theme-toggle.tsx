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
        className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#1a1a1e] text-white transition-colors hover:bg-[#222228]"
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
    <div className="flex rounded-full bg-[#1a1a1e] p-1">
      <button
        type="button"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-medium transition-colors",
          !isDark
            ? "bg-[#7c3aed] text-white"
            : "text-[#6b6b73] hover:text-[#9a9aa3]",
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
            : "text-[#6b6b73] hover:text-[#9a9aa3]",
        )}
      >
        <Moon className="size-3.5 stroke-[1.75]" />
        Dark
      </button>
    </div>
  );
}
