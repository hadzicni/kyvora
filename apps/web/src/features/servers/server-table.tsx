"use client";

import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";

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

function formatRelativeLastSeen(
  value: string | null,
  format: ReturnType<typeof useFormatter>,
  t: ReturnType<typeof useTranslations>
) {
  if (!value) {
    return t("common.never");
  }

  const elapsedMs = Date.now() - new Date(value).getTime();
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60_000));

  if (elapsedMinutes < 1) {
    return t("common.justNow");
  }

  return format.relativeTime(new Date(value), new Date());
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
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const showActions = canDelete || canEdit;

  function openServer(serverId: string) {
    router.push(`/servers/${encodeURIComponent(serverId)}`);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("servers.nameHeader")}</TableHead>
          <TableHead>{t("servers.hostnameHeader")}</TableHead>
          <TableHead>{t("servers.ipHeader")}</TableHead>
          <TableHead>{t("forms.status")}</TableHead>
          <TableHead>{t("servers.osHeader")}</TableHead>
          <TableHead>{t("servers.tagsHeader")}</TableHead>
          <TableHead>{t("servers.lastSeenHeader")}</TableHead>
          {showActions ? (
            <TableHead className="w-20 text-right">
              {t("servers.actionsHeader")}
            </TableHead>
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
                {server.description || t("servers.noDescription")}
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
                    {t("servers.noRecentHeartbeat")}
                  </span>
                ) : null}
                {server.status === "UNKNOWN" ? (
                  <span className="text-xs text-amber-300/90">
                    {t("servers.awaitingSignal")}
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="max-w-48 truncate">
              {server.operatingSystem || (
                <span className="text-muted-foreground">
                  {t("common.unknown")}
                </span>
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
                  <span className="text-xs text-muted-foreground">
                    {t("common.none")}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <div className="font-medium text-foreground">
                {formatRelativeLastSeen(server.lastSeenAt, format, t)}
              </div>
              <div className="text-xs">
                {server.lastSeenAt
                  ? formatDateTime(server.lastSeenAt, locale)
                  : t("common.never")}
              </div>
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
