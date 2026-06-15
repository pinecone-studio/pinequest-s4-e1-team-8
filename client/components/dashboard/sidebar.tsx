"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentUser } from "@/lib/mock-data";
import { isNavItemActive, navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, SettingsIcon } from "lucide-react";
import { Grand_Hotel } from "next/font/google";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const grandHotel = Grand_Hotel({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeScope = searchParams.get("scope") ?? "mine";
  const [expandedOverrides, setExpandedOverrides] = useState<
    Record<string, boolean>
  >({});

  const isSubmenuExpanded = (href: string) => {
    if (href in expandedOverrides) return expandedOverrides[href];
    return isNavItemActive(pathname, href);
  };

  const toggleSubmenu = (href: string) => {
    setExpandedOverrides((prev) => {
      const currentlyExpanded =
        href in prev ? prev[href] : isNavItemActive(pathname, href);

      return { ...prev, [href]: !currentlyExpanded };
    });
  };

  useEffect(() => {
    setExpandedOverrides((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const item of navItems) {
        if (
          item.children &&
          !isNavItemActive(pathname, item.href) &&
          item.href in next
        ) {
          delete next[item.href];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [pathname]);

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
          const expanded = item.children ? isSubmenuExpanded(item.href) : false;
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <div
                className={cn(
                  "flex items-center rounded-xl transition-colors duration-150",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Link
                  href={item.href}
                  className="flex flex-1 items-center gap-3 px-3 py-2 text-sm font-medium"
                >
                  <Icon className="size-4.5" />
                  <span>{item.label}</span>
                </Link>

                {item.children ? (
                  <button
                    type="button"
                    aria-label={expanded ? "Collapse section" : "Expand section"}
                    aria-expanded={expanded}
                    onClick={() => toggleSubmenu(item.href)}
                    className={cn(
                      "mr-2 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-primary/10",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <ChevronDownIcon
                      className={cn(
                        "size-3.5 shrink-0 transition-transform duration-150",
                        expanded ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </button>
                ) : null}
              </div>

              {item.children && expanded ? (
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
