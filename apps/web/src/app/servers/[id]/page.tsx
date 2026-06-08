"use client";

import {
  ArrowLeft,
  CalendarClock,
  Cpu,
  Fingerprint,
  Network,
  RefreshCw,
  Server,
  TagsIcon,
} from "lucide-react";
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
  muted,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-2 min-h-5 break-words text-sm text-foreground",
          mono && "font-mono text-xs",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailSection({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

function ServerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-64 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-4 w-full max-w-2xl" />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="border-b">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
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
            Back to Servers
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

function formatDetailDateTime(value: string | null | undefined) {
  if (!value) {
    return "Never seen";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ServerDetails({ server }: { server: ServerInventoryItem }) {
  const description = server.description.trim();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Server className="size-4" />
                Server inventory record
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-words text-3xl font-semibold tracking-tight">
                  {server.name}
                </h1>
                <ServerStatusBadge status={server.status} />
              </div>
              <CardDescription className="break-words font-mono text-xs">
                {server.hostname} / {server.ipAddress}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <EditServerDialog server={server} triggerLabel="Edit" />
              <DeleteServerDialog server={server} triggerLabel="Delete" />
              <Button asChild variant="outline">
                <Link href="/servers">
                  <ArrowLeft className="size-4" />
                  Back to Servers
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {description || "No description has been added for this server."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection
          title="Identity"
          description="Inventory identity and descriptive metadata."
          icon={<Fingerprint className="size-4 text-muted-foreground" />}
        >
          <Field label="Name" value={server.name} />
          <Field
            label="Status"
            value={<ServerStatusBadge status={server.status} />}
          />
          <Field
            label="Description"
            value={description || "No description"}
            muted={!description}
          />
        </DetailSection>

        <DetailSection
          title="Network"
          description="Addressing details used to reach this server."
          icon={<Network className="size-4 text-muted-foreground" />}
        >
          <Field label="Hostname" value={server.hostname} mono />
          <Field label="IP address" value={server.ipAddress} mono />
        </DetailSection>

        <DetailSection
          title="Operating system"
          description="Reported platform information."
          icon={<Cpu className="size-4 text-muted-foreground" />}
        >
          <Field
            label="Operating system"
            value={server.operatingSystem || "Unknown"}
            muted={!server.operatingSystem}
          />
        </DetailSection>

        <DetailSection
          title="Tags"
          description="Labels used for filtering and organization."
          icon={<TagsIcon className="size-4 text-muted-foreground" />}
        >
          <Field label="Tags" value={<Tags server={server} />} />
        </DetailSection>

        <div className="xl:col-span-2">
          <DetailSection
            title="Timestamps"
            description="Lifecycle and agent visibility timestamps."
            icon={<CalendarClock className="size-4 text-muted-foreground" />}
          >
            <Field
              label="Last seen"
              value={formatDetailDateTime(server.lastSeenAt)}
              muted={!server.lastSeenAt}
            />
            <Field
              label="Created"
              value={formatDetailDateTime(server.createdAt)}
            />
            <Field
              label="Updated"
              value={formatDetailDateTime(server.updatedAt)}
            />
            <Field label="Record ID" value={server.id} mono />
          </DetailSection>
        </div>
      </div>
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
        {serverQuery.isSuccess ? (
          <ServerDetails server={serverQuery.data} />
        ) : null}
      </div>
    </AppShell>
  );
}
