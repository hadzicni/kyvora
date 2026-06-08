"use client";

import { ArrowLeft, RefreshCw, Server } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteServerDialog } from "@/features/servers/delete-server-dialog";
import { EditServerDialog } from "@/features/servers/edit-server-dialog";
import { formatDateTime } from "@/features/servers/format";
import { ServerErrorState } from "@/features/servers/server-error-state";
import { ServerStatusBadge } from "@/features/servers/server-status-badge";
import { useServer } from "@/features/servers/use-servers";
import { ApiError, type ServerInventoryItem } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

function getParamId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : (id ?? "");
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-2 min-h-5 break-words text-sm text-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ServerDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton className="h-20 w-full" key={index} />
        ))}
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server not found</CardTitle>
        <CardDescription>
          This inventory entry does not exist or has already been deleted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href="/servers">
            <ArrowLeft className="size-4" />
            Back to inventory
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function Tags({ server }: { server: ServerInventoryItem }) {
  if (server.tags.length === 0) {
    return <span className="text-muted-foreground">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {server.tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

function ServerDetails({ server }: { server: ServerInventoryItem }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Server className="size-5 text-muted-foreground" />
                <CardTitle className="text-2xl">{server.name}</CardTitle>
                <ServerStatusBadge status={server.status} />
              </div>
              <CardDescription className="font-mono text-xs">
                {server.hostname} - {server.ipAddress}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <EditServerDialog server={server} />
              <DeleteServerDialog server={server} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {server.description || "No description"}
          </p>
        </CardContent>
      </Card>

      <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Name" value={server.name} />
        <Field label="Hostname" value={server.hostname} mono />
        <Field label="IP address" value={server.ipAddress} mono />
        <Field
          label="Description"
          value={server.description || "No description"}
        />
        <Field label="Tags" value={<Tags server={server} />} />
        <Field
          label="Operating system"
          value={server.operatingSystem || "Unknown"}
        />
        <Field
          label="Status"
          value={<ServerStatusBadge status={server.status} />}
        />
        <Field label="Last seen" value={formatDateTime(server.lastSeenAt)} />
        <Field label="Created" value={formatDateTime(server.createdAt)} />
        <Field label="Updated" value={formatDateTime(server.updatedAt)} />
      </dl>
    </div>
  );
}

export default function ServerDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const id = getParamId(params.id);
  const serverQuery = useServer(id);
  const isNotFound =
    serverQuery.error instanceof ApiError && serverQuery.error.status === 404;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild className="-ml-2 mb-2" size="sm" variant="ghost">
              <Link href="/servers">
                <ArrowLeft className="size-4" />
                Servers
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              Server detail
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Full inventory record from /api/v1/servers/{id || "[id]"}.
            </p>
          </div>
          <Button
            disabled={serverQuery.isFetching}
            onClick={() => void serverQuery.refetch()}
            variant="outline"
          >
            <RefreshCw
              className={cn("size-4", serverQuery.isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {serverQuery.isLoading ? <ServerDetailSkeleton /> : null}
        {serverQuery.isError && isNotFound ? <NotFoundState /> : null}
        {serverQuery.isError && !isNotFound ? (
          <ServerErrorState
            message={
              serverQuery.error instanceof Error
                ? serverQuery.error.message
                : "The inventory API returned an unexpected error."
            }
            onRetry={() => void serverQuery.refetch()}
          />
        ) : null}
        {serverQuery.isSuccess ? <ServerDetails server={serverQuery.data} /> : null}
      </div>
    </AppShell>
  );
}
