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

export function AgentTable({ agents }: { agents: Agent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Server</TableHead>
          <TableHead>Hostname</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead>Registered</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell>
              <div className="font-medium">{agent.name}</div>
              <div className="max-w-52 truncate text-xs text-muted-foreground">
                {agent.id}
              </div>
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
            <TableCell className="font-mono text-xs">{agent.version}</TableCell>
            <TableCell>
              <AgentStatusBadge status={agent.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(agent.lastSeenAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(agent.registeredAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
