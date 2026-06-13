"use client";

import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { UserButton } from "@clerk/nextjs";
import { MoonIcon, SearchIcon, SunIcon } from "lucide-react";

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground lg:hidden">
        B
      </div>

      <div className="relative max-w-md flex-1">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search meetings, notes, recordings..."
          className="rounded-full bg-inset pl-8"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? (
            <SunIcon className="size-4.5" />
          ) : (
            <MoonIcon className="size-4.5" />
          )}
        </Button>
        <NotificationsMenu />
        <UserButton />
      </div>
    </header>
  );
}
