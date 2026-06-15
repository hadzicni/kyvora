"use client";

import { Check, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  NotificationSeverityBadge,
  NotificationSeverityIcon,
} from "@/features/notifications/components/notification-severity";
import type { NotificationItem as NotificationItemType } from "@/features/notifications/types/notification";
import { cn } from "@/lib/utils";

type NotificationItemProps = {
  notification: NotificationItemType;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  dismissing?: boolean;
  markingRead?: boolean;
};

export function NotificationItem({
  notification,
  onDismiss,
  onMarkRead,
  dismissing = false,
  markingRead = false,
}: NotificationItemProps) {
  return (
    <article
      className={cn(
        "group relative border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/30",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex gap-3">
        <NotificationSeverityIcon severity={notification.severity} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-foreground">
                {notification.title}
              </h3>
              <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                {notification.message}
              </p>
            </div>
            {!notification.read ? (
              <span className="mt-1 size-2 shrink-0 rounded-full bg-violet-400">
                <span className="sr-only">Unread</span>
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <NotificationSeverityBadge severity={notification.severity} />
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </span>
            {notification.relatedResourceUrl ? (
              <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Link href={notification.relatedResourceUrl}>
                  <ExternalLink className="size-3" />
                  Open
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-1">
        {!notification.read ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={markingRead}
            onClick={() => onMarkRead(notification.id)}
          >
            <Check className="size-3.5" />
            Mark read
          </Button>
        ) : null}
        {notification.dismissible ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            disabled={dismissing}
            onClick={() => onDismiss(notification.id)}
          >
            <Trash2 className="size-3.5" />
            Dismiss
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
