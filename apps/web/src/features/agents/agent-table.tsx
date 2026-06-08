"use client";

import { Loader2, Radio } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { useSendAgentHeartbeat } from "./use-agents";

export function AgentTable({ agents }: { agents: Agent[] }) {
  const heartbeat = useSendAgentHeartbeat();

  async function sendHeartbeat(agent: Agent) {
    try {
      await heartbeat.mutateAsync({
        id: agent.id,
        input: {
          status: "ONLINE",
          version: agent.version,
        },
      });
      toast.success(`Heartbeat sent for ${agent.hostname}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send heartbeat right now."
      );
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Hostname</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead>Registered</TableHead>
          <TableHead className="w-36 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => {
          const isSending =
            heartbeat.isPending && heartbeat.variables?.id === agent.id;

          return (
            <TableRow key={agent.id}>
              <TableCell>
                <div className="font-medium">{agent.name}</div>
                <div className="max-w-52 truncate text-xs text-muted-foreground">
                  {agent.id}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {agent.hostname}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {agent.version}
              </TableCell>
              <TableCell>
                <AgentStatusBadge status={agent.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(agent.lastSeenAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(agent.registeredAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    disabled={heartbeat.isPending}
                    onClick={() => void sendHeartbeat(agent)}
                    size="sm"
                    variant="outline"
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Radio className="size-4" />
                    )}
                    Send heartbeat
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
