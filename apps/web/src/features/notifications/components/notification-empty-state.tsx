"use client";

import { Bell } from "lucide-react";

export function NotificationEmptyState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground">
        <Bell className="size-5" />
      </div>
      <div>
        <div className="text-sm font-medium">No notifications</div>
        <div className="mt-1 max-w-64 text-xs text-muted-foreground">
          Important system updates and action results will appear here.
        </div>
      </div>
    </div>
  );
}
