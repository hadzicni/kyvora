"use client";

import {
  ArrowLeft,
  Cable,
  CalendarClock,
  Copy,
  ExternalLink,
  Fingerprint,
  LinkIcon,
  Network,
  RefreshCw,
  Server,
  TagsIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { toast } from "sonner";

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
import { DeleteServiceDialog } from "@/features/services/delete-service-dialog";
import { EditServiceDialog } from "@/features/services/edit-service-dialog";
import { ServiceErrorState } from "@/features/services/service-error-state";
import { formatCategory } from "@/features/services/service-form";
import { useService } from "@/features/services/use-services";
import { formatDateTime } from "@/features/servers/format";
import { useServers } from "@/features/servers/use-servers";
import {
  ServiceApiError,
  type ManagedServiceItem,
} from "@/lib/api/services";
import { canDeleteServices, canUpdateServices } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function getParamId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : (id ?? "");
}

function Field({
  label,
  mono,
  muted,
  value,
}: {
  label: string;
  mono?: boolean;
  muted?: boolean;
  value: ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
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
        <CardTitle className="flex items-center gap-2 text-base">
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

function ServiceUrl({ service }: { service: ManagedServiceItem }) {
  if (!service.url) {
    return <span className="text-muted-foreground">None</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <a
        className="min-w-0 break-all text-primary underline-offset-4 hover:underline"
        href={service.url}
        rel="noreferrer"
        target="_blank"
      >
        {service.url}
      </a>
      <Button aria-label={`Open ${service.name}`} asChild size="icon" variant="ghost">
        <a href={service.url} rel="noreferrer" target="_blank">
          <ExternalLink className="size-4" />
        </a>
      </Button>
      <Button
        aria-label={`Copy URL for ${service.name}`}
        onClick={() => {
          void navigator.clipboard.writeText(service.url ?? "");
          toast.success("URL copied.");
        }}
        size="icon"
        variant="ghost"
      >
        <Copy className="size-4" />
      </Button>
    </div>
  );
}

function Tags({ service }: { service: ManagedServiceItem }) {
  if (service.tags.length === 0) {
    return <span className="text-muted-foreground">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {service.tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

function hostEndpoint(service: ManagedServiceItem) {
  const host = service.hostname || service.ipAddress;

  if (!host) {
    return "Unassigned";
  }

  return service.port ? `${host}:${service.port}` : host;
}

function ServiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-72 max-w-full" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-5 w-full max-w-2xl" />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
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
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
        <Cable className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium">Service not found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This service does not exist or has already been removed from the registry.
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link href="/services">Back to Services</Link>
      </Button>
    </div>
  );
}

function ServiceDetail({
  canDelete,
  canUpdate,
  service,
  servers,
}: {
  canDelete: boolean;
  canUpdate: boolean;
  service: ManagedServiceItem;
  servers: Parameters<typeof EditServiceDialog>[0]["servers"];
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Cable className="size-4" />
                Managed service
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-words text-3xl font-semibold tracking-tight">
                  {service.name}
                </h1>
                <Badge variant="secondary">{formatCategory(service.category)}</Badge>
                <Badge variant="outline">{service.protocol}</Badge>
              </div>
              <CardDescription className="break-words">
                {service.description || "No description provided."}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {service.url ? (
                <Button asChild variant="outline">
                  <a href={service.url} rel="noreferrer" target="_blank">
                    <ExternalLink className="size-4" />
                    Open
                  </a>
                </Button>
              ) : null}
              {canUpdate ? <EditServiceDialog service={service} servers={servers} /> : null}
              {canDelete ? (
                <DeleteServiceDialog
                  onDeleted={() => router.push("/services")}
                  service={service}
                />
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Service metadata for routing, ownership, and homelab inventory.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection
          description="Identity, category, and lifecycle timestamps."
          icon={<Fingerprint className="size-4 text-muted-foreground" />}
          title="Service identity"
        >
          <Field label="Service ID" value={service.id} mono />
          <Field label="Name" value={service.name} />
          <Field label="Category" value={formatCategory(service.category)} />
          <Field label="Protocol" value={<Badge variant="secondary">{service.protocol}</Badge>} />
          <Field label="Created" value={formatDateTime(service.createdAt)} />
          <Field label="Updated" value={formatDateTime(service.updatedAt)} />
        </DetailSection>

        <DetailSection
          description="How operators reach this service."
          icon={<Network className="size-4 text-muted-foreground" />}
          title="Endpoint"
        >
          <Field label="URL" value={<ServiceUrl service={service} />} muted={!service.url} />
          <Field label="Host endpoint" value={hostEndpoint(service)} mono muted={!service.hostname && !service.ipAddress} />
          <Field label="Hostname" value={service.hostname ?? "Unassigned"} mono muted={!service.hostname} />
          <Field label="IP address" value={service.ipAddress ?? "Unassigned"} mono muted={!service.ipAddress} />
          <Field label="Port" value={service.port ?? "Unassigned"} mono muted={!service.port} />
        </DetailSection>

        <DetailSection
          description="Inventory relationship to the server registry."
          icon={<Server className="size-4 text-muted-foreground" />}
          title="Linked server"
        >
          {service.linkedServer ? (
            <>
              <Field label="Server name" value={service.linkedServer.name} />
              <Field label="Hostname" value={service.linkedServer.hostname} mono />
              <Field label="IP address" value={service.linkedServer.ipAddress} mono />
              <Field
                label="Server link"
                value={
                  <Link
                    className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline"
                    href={`/servers/${service.linkedServer.id}`}
                  >
                    <LinkIcon className="size-4" />
                    View linked server
                  </Link>
                }
              />
            </>
          ) : (
            <Field label="Assignment" value="No linked server" muted />
          )}
        </DetailSection>

        <DetailSection
          description="Labels and operator notes for this service."
          icon={<TagsIcon className="size-4 text-muted-foreground" />}
          title="Metadata"
        >
          <Field label="Tags" value={<Tags service={service} />} />
          <Field
            label="Notes"
            value={
              service.notes ? (
                <span className="whitespace-pre-wrap">{service.notes}</span>
              ) : (
                "None"
              )
            }
            muted={!service.notes}
          />
        </DetailSection>

        <DetailSection
          description="Current status model for this manually registered service."
          icon={<CalendarClock className="size-4 text-muted-foreground" />}
          title="Operations"
        >
          <Field label="Health checks" value="Not configured" muted />
          <Field label="Last check" value="Never" muted />
        </DetailSection>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { data: session } = useSession();
  const params = useParams<{ id?: string | string[] }>();
  const id = getParamId(params.id);
  const serviceQuery = useService(id);
  const serversQuery = useServers({ size: 100, sort: "name,asc" });
  const servers = serversQuery.data?.content ?? [];
  const isNotFound =
    serviceQuery.error instanceof ServiceApiError && serviceQuery.error.status === 404;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild className="-ml-2 mb-2" size="sm" variant="ghost">
              <Link href="/services">
                <ArrowLeft className="size-4" />
                Services
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              Service detail
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Full service record from /api/v1/services/{id || "[id]"}.
            </p>
          </div>
          <Button
            disabled={serviceQuery.isFetching}
            onClick={() => void serviceQuery.refetch()}
            variant="outline"
          >
            <RefreshCw
              className={cn("size-4", serviceQuery.isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {serviceQuery.isLoading ? <ServiceDetailSkeleton /> : null}
        {serviceQuery.isError && isNotFound ? <NotFoundState /> : null}
        {serviceQuery.isError && !isNotFound ? (
          <ServiceErrorState
            message={
              serviceQuery.error instanceof Error
                ? serviceQuery.error.message
                : "The services API returned an unexpected error."
            }
            onRetry={() => void serviceQuery.refetch()}
          />
        ) : null}
        {serviceQuery.isSuccess ? (
          <ServiceDetail
            canDelete={canDeleteServices(session?.user.permissions)}
            canUpdate={canUpdateServices(session?.user.permissions)}
            service={serviceQuery.data}
            servers={servers}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
