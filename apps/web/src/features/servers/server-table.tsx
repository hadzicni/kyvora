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

export function ServerTable({ servers }: { servers: ServerInventoryItem[] }) {
  const router = useRouter();

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
          <TableHead className="w-20 text-right">Actions</TableHead>
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
            <TableCell>
              <div className="font-medium">{server.name}</div>
              <div className="max-w-52 truncate text-xs text-muted-foreground">
                {server.description || "No description"}
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs">{server.hostname}</TableCell>
            <TableCell className="font-mono text-xs">{server.ipAddress}</TableCell>
            <TableCell>
              <ServerStatusBadge status={server.status} />
            </TableCell>
            <TableCell>{server.operatingSystem || "Unknown"}</TableCell>
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
              {formatDateTime(server.lastSeenAt)}
            </TableCell>
            <TableCell
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <div className="flex justify-end gap-1">
                <EditServerDialog server={server} />
                <DeleteServerDialog server={server} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
