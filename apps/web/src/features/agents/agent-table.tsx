"use client";

import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateTime,
  formatRelativeLastSeen,
} from "@/features/servers/format";
import type { Agent } from "@/lib/api/agents";

import { AgentStatusBadge } from "./agent-status-badge";

export function AgentTable({
  agents,
  compact = false,
}: {
  agents: Agent[];
  compact?: boolean;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("forms.name")}</TableHead>
          <TableHead>{t("agents.server")}</TableHead>
          {!compact ? <TableHead>{t("forms.hostname")}</TableHead> : null}
          <TableHead>{t("forms.status")}</TableHead>
          <TableHead>{t("agents.lastSeen")}</TableHead>
          {!compact ? <TableHead>{t("agents.version")}</TableHead> : null}
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
                  {compact ? agent.hostname : agent.id}
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
                <span className="text-muted-foreground">
                  {t("common.unassigned")}
                </span>
              )}
            </TableCell>
            {!compact ? (
              <TableCell className="font-mono text-xs">
                {agent.hostname}
              </TableCell>
            ) : null}
            <TableCell>
              <AgentStatusBadge status={agent.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              <div className="font-medium text-foreground">
                {formatRelativeLastSeen(agent.lastSeenAt, format, t)}
              </div>
              <div className="text-xs">
                {agent.lastSeenAt
                  ? formatDateTime(agent.lastSeenAt, locale)
                  : t("common.never")}
              </div>
            </TableCell>
            {!compact ? (
              <TableCell className="font-mono text-xs">{agent.version}</TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
