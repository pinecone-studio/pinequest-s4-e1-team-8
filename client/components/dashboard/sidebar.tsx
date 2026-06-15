"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentUser } from "@/lib/mock-data";
import { isNavItemActive, navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, SettingsIcon } from "lucide-react";
import { Grand_Hotel } from "next/font/google";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const grandHotel = Grand_Hotel({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeScope = searchParams.get("scope") ?? "mine";

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className={cn(grandHotel.className, "text-3xl text-foreground")}>
          Brisk
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4.5" />
                <span className="flex-1">{item.label}</span>
                {item.children ? (
                  <ChevronDownIcon
                    className={cn(
                      "size-3.5 shrink-0 transition-transform duration-150",
                      active ? "rotate-180" : "rotate-0",
                    )}
                  />
                ) : null}
              </Link>

              {item.children && active ? (
                <div className="mt-1 flex flex-col gap-1 pl-4">
                  {item.children.map((child) => (
                    <Link
                      key={child.scope}
                      href={`${item.href}?scope=${child.scope}`}
                      className={cn(
                        "rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                        activeScope === child.scope
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            isNavItemActive(pathname, "/settings")
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <SettingsIcon className="size-4.5" />
          Settings
        </Link>

        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
            isNavItemActive(pathname, "/profile")
              ? "bg-primary/10"
              : "hover:bg-muted",
          )}
        >
          <Avatar size="sm">
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {currentUser.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {currentUser.role}
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
