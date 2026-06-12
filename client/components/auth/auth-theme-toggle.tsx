"use client";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function AuthThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <div className={cn("flex rounded-full bg-muted p-1", className)}>
      <button
        type="button"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-colors",
          !isDark
            ? "bg-primary text-primary-foreground"
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
          "flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-colors",
          isDark
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="size-3.5 stroke-[1.75]" />
        Dark
      </button>
    </div>
  );
}
