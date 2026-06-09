"use client";

import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/features/servers/format";
import type { Agent } from "@/lib/api/agents";

import { AgentStatusBadge } from "./agent-status-badge";

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

export function AgentTable({ agents }: { agents: Agent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Server</TableHead>
          <TableHead>Hostname</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead>Version</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell>
              <Link
                className="group inline-flex min-w-0 flex-col gap-0.5 hover:text-foreground"
                href={`/agents/${agent.id}`}
              >
                <span className="max-w-52 truncate font-medium underline-offset-4 group-hover:underline">
                  {agent.name}
                </span>
                <span className="max-w-52 truncate text-xs text-muted-foreground">
                  {agent.id}
                </span>
              </Link>
            </TableCell>
            <TableCell>
              {agent.serverId ? (
                <Link
                  className="group inline-flex min-w-0 flex-col gap-0.5 hover:text-foreground"
                  href={`/servers/${agent.serverId}`}
                >
                  <span className="max-w-48 truncate font-medium underline-offset-4 group-hover:underline">
                    {agent.serverName ?? agent.serverHostname ?? agent.serverId}
                  </span>
                  <span className="max-w-48 truncate font-mono text-xs text-muted-foreground">
                    {agent.serverHostname ?? agent.serverId}
                  </span>
                </Link>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">{agent.hostname}</TableCell>
            <TableCell>
              <AgentStatusBadge status={agent.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              <div>{formatRelativeLastSeen(agent.lastSeenAt)}</div>
              <div className="text-xs">{formatDateTime(agent.lastSeenAt)}</div>
            </TableCell>
            <TableCell className="font-mono text-xs">{agent.version}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
