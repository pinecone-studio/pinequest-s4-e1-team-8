"use client";

import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  cardClassName?: string;
};

export function AuthShell({ children, cardClassName }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12">
      <div className="absolute top-6 right-6 w-[168px]">
        <AuthThemeToggle />
      </div>

      <div className="mb-6 flex items-center gap-2.5">
        <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-violet-600 text-base font-bold text-white">
          B
        </div>
        <span className="text-lg font-semibold tracking-[-0.3px] text-foreground">
          Brisk
        </span>
      </div>

      <div
        className={`w-full max-w-[480px] rounded-2xl border border-border bg-card p-[28px_30px_30px] shadow-lg dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)] ${cardClassName ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}
