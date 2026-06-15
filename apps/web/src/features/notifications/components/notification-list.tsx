"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationEmptyState } from "@/features/notifications/components/notification-empty-state";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import type { NotificationItem as NotificationItemType } from "@/features/notifications/types/notification";

type NotificationListProps = {
  notifications: NotificationItemType[];
  error?: boolean;
  loading?: boolean;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  onRetry: () => void;
  pendingDismissId?: string;
  pendingReadId?: string;
};

export function NotificationList({
  notifications,
  error = false,
  loading = false,
  onDismiss,
  onMarkRead,
  onRetry,
  pendingDismissId,
  pendingReadId,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="flex gap-3" key={index}>
            <Skeleton className="size-8 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <div className="text-sm font-medium">Unable to load notifications</div>
          <div className="mt-1 max-w-64 text-xs text-muted-foreground">
            Check the backend connection and try again.
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <Loader2 className="hidden size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return <NotificationEmptyState />;
  }

  return (
    <div>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          onMarkRead={onMarkRead}
          dismissing={pendingDismissId === notification.id}
          markingRead={pendingReadId === notification.id}
        />
      ))}
    </div>
  );
}
