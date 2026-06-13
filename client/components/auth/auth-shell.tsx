"use client";

import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  cardClassName?: string;
  variant?: "card" | "plain";
  showLogo?: boolean;
};

export function AuthShell({
  children,
  cardClassName,
  variant = "card",
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12">
      <div className="absolute top-6 right-6 w-[168px]">
        <AuthThemeToggle />
      </div>

      {variant === "card" ? (
        <div
          className={cn(
            "w-full max-w-[480px] rounded-2xl border border-border bg-card p-[28px_30px_30px] shadow-lg dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)]",
            cardClassName,
          )}
        >
          {children}
        </div>
      ) : (
        <div className={cn("w-full max-w-[480px]", cardClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
