"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/hooks/use-notifications";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { NotificationUnreadBadge } from "@/features/notifications/components/notification-unread-badge";
import { ApiError } from "@/lib/api/servers";

export function NotificationBell() {
  const { status } = useSession();
  const enabled = status === "authenticated";
  const [open, setOpen] = useState(false);
  const [pendingReadId, setPendingReadId] = useState<string | undefined>();
  const [pendingDismissId, setPendingDismissId] = useState<string | undefined>();
  const notificationsQuery = useNotifications({ size: 20 }, enabled && open);
  const unreadQuery = useUnreadNotificationCount(enabled);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const unreadCount = unreadQuery.data?.count ?? 0;

  async function handleMarkRead(id: string) {
    setPendingReadId(id);
    try {
      await markRead.mutateAsync(id);
    } catch (error) {
      toast.error("Unable to mark notification as read", {
        description: errorMessage(error),
      });
    } finally {
      setPendingReadId(undefined);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead.mutateAsync();
    } catch (error) {
      toast.error("Unable to mark notifications as read", {
        description: errorMessage(error),
      });
    }
  }

  async function handleDismiss(id: string) {
    setPendingDismissId(id);
    try {
      await dismiss.mutateAsync(id);
    } catch (error) {
      toast.error("Unable to dismiss notification", {
        description: errorMessage(error),
      });
    } finally {
      setPendingDismissId(undefined);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label={
            unreadCount > 0
              ? `Open notifications, ${unreadCount} unread`
              : "Open notifications"
          }
          className="relative"
          size="icon"
          variant="ghost"
        >
          <Bell className="size-4" />
          <NotificationUnreadBadge count={unreadCount} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-start justify-between gap-3 pr-10">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                Review important application and infrastructure events.
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={unreadCount === 0 || markAllRead.isPending}
              onClick={() => void handleMarkAllRead()}
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              Mark all read
            </Button>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NotificationList
            notifications={notificationsQuery.data?.content ?? []}
            loading={notificationsQuery.isLoading}
            error={notificationsQuery.isError}
            onRetry={() => void notificationsQuery.refetch()}
            onDismiss={(id) => void handleDismiss(id)}
            onMarkRead={(id) => void handleMarkRead(id)}
            pendingDismissId={pendingDismissId}
            pendingReadId={pendingReadId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Try again in a moment.";
}
