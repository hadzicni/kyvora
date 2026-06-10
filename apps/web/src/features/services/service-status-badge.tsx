"use client";

import { Badge } from "@/components/ui/badge";
import type { ServiceStatus } from "@/lib/api/services";

const statusStyles: Record<ServiceStatus, string> = {
  ONLINE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  OFFLINE: "border-red-500/40 bg-red-500/10 text-red-300",
  UNKNOWN: "border-amber-500/40 bg-amber-500/10 text-amber-300",
};

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <Badge className={statusStyles[status]} variant="outline">
      {status}
    </Badge>
  );
}
