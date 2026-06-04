"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <div className="flex rounded-full bg-[#0e0f13] p-1">
      <button
        type="button"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[12px] font-medium transition-colors ${
          !isDark
            ? "bg-white/15 text-slate-200"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        <Sun className="size-3.5" />
        Light
      </button>
      <button
        type="button"
        aria-pressed={isDark}
        onClick={() => setTheme("dark")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[12px] font-medium transition-colors ${
          isDark
            ? "bg-violet-600 text-white"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        <Moon className="size-3.5" />
        Dark
      </button>
    </div>
  );
}
