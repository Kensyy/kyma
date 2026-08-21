"use client";

import { useRouter } from "next/navigation";
import { relativeTime } from "@/lib/relative-time";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import type { NotificationModel } from "@/generated/prisma/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function entityHref(notification: NotificationModel): string | null {
  if (!notification.entityType || !notification.entityId) return null;
  return notification.entityType === "TICKET"
    ? `/tickets/${notification.entityId}`
    : `/assets/${notification.entityId}`;
}

export function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const router = useRouter();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleSelect(notification: NotificationModel) {
    if (!notification.read) markRead.mutate(notification.id);
    const href = entityHref(notification);
    if (href) router.push(href);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-sidebar-accent/60 relative flex h-8 w-8 items-center justify-center rounded-md outline-none">
        <svg
          width="17"
          height="17"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 8a5 5 0 0 1 10 0c0 4.2 1.5 5.5 1.5 5.5h-13S5 12.2 5 8Z" />
          <path d="M8.3 16a1.8 1.8 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="bg-destructive absolute top-1 right-1 h-2 w-2 rounded-full" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-primary text-xs font-medium hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="text-muted-foreground px-1.5 py-3 text-sm">
            No notifications yet.
          </p>
        )}
        {notifications.map((n) => (
          <DropdownMenuItem
            key={n.id}
            onClick={() => handleSelect(n)}
            className="flex flex-col items-start gap-0.5 whitespace-normal"
          >
            <span className={cn("text-sm", !n.read && "font-semibold")}>
              {n.message}
            </span>
            <span className="text-muted-foreground text-[11px]">
              {relativeTime(n.createdAt)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
