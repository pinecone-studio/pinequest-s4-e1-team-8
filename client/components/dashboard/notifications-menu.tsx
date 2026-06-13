"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/types";
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCheckIcon,
  InfoIcon,
  ListChecksIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const typeStyles: Record<
  NotificationType,
  { icon: typeof BellIcon; className: string }
> = {
  meeting: {
    icon: CalendarDaysIcon,
    className: "bg-lavender text-lavender-foreground",
  },
  task: { icon: ListChecksIcon, className: "bg-sage text-sage-foreground" },
  team: {
    icon: UsersIcon,
    className: "bg-tag-yellow text-tag-yellow-foreground",
  },
  system: { icon: InfoIcon, className: "bg-muted text-muted-foreground" },
};

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  const handleItemClick = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <BellIcon className="size-4.5" />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-primary" />
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            Notifications
          </span>
          {unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheckIcon className="size-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1.5">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            notifications.map((notification) => {
              const { icon: Icon, className } = typeStyles[notification.type];
              return (
                <button
                  key={notification.id}
                  onClick={() => handleItemClick(notification.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted",
                    !notification.read && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      className,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notification.timestamp}
                    </p>
                  </div>
                  {!notification.read ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
