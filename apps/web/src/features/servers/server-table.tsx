"use client";

import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServerInventoryItem } from "@/lib/api/servers";
import { DeleteServerDialog } from "./delete-server-dialog";
import { EditServerDialog } from "./edit-server-dialog";
import { formatDateTime } from "./format";
import { ServerStatusBadge } from "./server-status-badge";

function formatRelativeLastSeen(value: string | null) {
  if (!value) {
    return "Never";
  }

  const elapsedMs = Date.now() - new Date(value).getTime();
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60_000));

  if (elapsedMinutes < 1) {
    return "Just now";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`;
  }

  return `${Math.round(elapsedHours / 24)} d ago`;
}

export function ServerTable({
  canDelete = true,
  canEdit = true,
  servers,
}: {
  canDelete?: boolean;
  canEdit?: boolean;
  servers: ServerInventoryItem[];
}) {
  const router = useRouter();
  const showActions = canDelete || canEdit;

  function openServer(serverId: string) {
    router.push(`/servers/${encodeURIComponent(serverId)}`);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Hostname</TableHead>
          <TableHead>IP address</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>OS</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Last seen</TableHead>
          {showActions ? (
            <TableHead className="w-20 text-right">Actions</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {servers.map((server) => (
          <TableRow
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            key={server.id}
            onClick={() => openServer(server.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openServer(server.id);
              }
            }}
            role="link"
            tabIndex={0}
          >
            <TableCell className="min-w-56">
              <div className="font-medium">{server.name}</div>
              <div className="max-w-52 truncate text-xs text-muted-foreground">
                {server.description || "No description"}
              </div>
            </TableCell>
            <TableCell>
              <div className="max-w-48 truncate font-mono text-xs">
                {server.hostname}
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs">{server.ipAddress}</TableCell>
            <TableCell>
              <div className="grid gap-1">
                <ServerStatusBadge status={server.status} />
                {server.status === "OFFLINE" ? (
                  <span className="text-xs text-red-300/90">
                    No recent heartbeat
                  </span>
                ) : null}
                {server.status === "UNKNOWN" ? (
                  <span className="text-xs text-amber-300/90">
                    Awaiting signal
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="max-w-48 truncate">
              {server.operatingSystem || (
                <span className="text-muted-foreground">Unknown</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex max-w-56 flex-wrap gap-1">
                {server.tags.length > 0 ? (
                  server.tags.map((tag) => (
                    <span
                      className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <div className="font-medium text-foreground">
                {formatRelativeLastSeen(server.lastSeenAt)}
              </div>
              <div className="text-xs">{formatDateTime(server.lastSeenAt)}</div>
            </TableCell>
            {showActions ? (
              <TableCell
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <div className="flex justify-end gap-1">
                  {canEdit ? <EditServerDialog server={server} /> : null}
                  {canDelete ? <DeleteServerDialog server={server} /> : null}
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
