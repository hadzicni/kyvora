"use client";

import {
  ArrowLeft,
  Cable,
  Copy,
  ExternalLink,
  LinkIcon,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";

import { AppShell } from "@/components/app/app-shell";
import { DetailLayout } from "@/components/app/detail-layout";
import { PageHeader, PageHeaderBackLink } from "@/components/app/page-header";
import { InfoList, InfoRow, PageSection } from "@/components/app/page-section";
import { SectionState } from "@/components/app/section-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteServiceDialog } from "@/features/services/delete-service-dialog";
import { EditServiceDialog } from "@/features/services/edit-service-dialog";
import { ServiceErrorState } from "@/features/services/service-error-state";
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

function ServiceUrl({ service }: { service: ManagedServiceItem }) {
  const t = useTranslations();

  if (!service.url) {
    return <span className="text-muted-foreground">{t("common.none")}</span>;
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
      <Button
        aria-label={t("services.openAria", { name: service.name })}
        asChild
        size="icon"
        variant="ghost"
      >
        <a href={service.url} rel="noreferrer" target="_blank">
          <ExternalLink className="size-4" />
        </a>
      </Button>
      <Button
        aria-label={t("services.copyUrlAria", { name: service.name })}
        onClick={() => {
          void navigator.clipboard.writeText(service.url ?? "");
          toast.success(t("services.urlCopiedToast"));
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
  const t = useTranslations();

  if (service.tags.length === 0) {
    return <span className="text-muted-foreground">{t("common.none")}</span>;
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

function hostEndpoint(service: ManagedServiceItem, fallback: string) {
  const host = service.hostname || service.ipAddress;

  if (!host) {
    return fallback;
  }

  return service.port ? `${host}:${service.port}` : host;
}

function ServiceDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="space-y-4" key={index}>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

function NotFoundState() {
  const t = useTranslations("services");

  return (
    <SectionState
      action={
        <Button asChild variant="outline">
          <Link href="/services">
            <ArrowLeft className="size-4" />
            {t("backToServices")}
          </Link>
        </Button>
      }
      description={t("notFoundDescription")}
      icon={<Cable className="size-5" />}
      title={t("notFoundTitle")}
    />
  );
}

function ServiceDetail({ service }: { service: ManagedServiceItem }) {
  const t = useTranslations();

  return (
    <DetailLayout
      aside={
        <>
          <PageSection
            description={t("services.endpointDescription")}
            title={t("services.endpoint")}
          >
            <InfoList>
              <InfoRow label={t("services.url")} value={<ServiceUrl service={service} />} />
              <InfoRow
                label={t("services.hostEndpoint")}
                mono
                value={hostEndpoint(service, t("common.unassigned"))}
              />
              <InfoRow
                label={t("services.port")}
                mono
                value={service.port ?? t("common.unassigned")}
              />
            </InfoList>
          </PageSection>

          <PageSection
            description={t("services.linkedServerDescription")}
            title={t("services.linkedServer")}
          >
            {service.linkedServer ? (
              <InfoList>
                <InfoRow
                  label={t("services.serverName")}
                  value={
                    <Link
                      className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
                      href={`/servers/${service.linkedServer.id}`}
                    >
                      {service.linkedServer.name}
                      <LinkIcon className="size-3.5" />
                    </Link>
                  }
                />
                <InfoRow
                  label={t("forms.hostname")}
                  mono
                  value={service.linkedServer.hostname}
                />
                <InfoRow
                  label={t("forms.ipAddress")}
                  mono
                  value={service.linkedServer.ipAddress}
                />
              </InfoList>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("services.noLinkedServer")}
              </p>
            )}
          </PageSection>

          <PageSection
            description={t("services.operationsDescription")}
            title={t("services.operations")}
          >
            <InfoList>
              <InfoRow
                label={t("services.healthChecks")}
                value={t("services.notConfigured")}
              />
              <InfoRow label={t("services.lastCheck")} value={t("common.never")} />
            </InfoList>
          </PageSection>
        </>
      }
    >
      <PageSection
        description={t("services.identityDescription")}
        title={t("services.identity")}
      >
        <div className="space-y-4">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {service.description || t("services.detailIntro")}
          </p>
          <InfoList className="max-w-2xl">
            <InfoRow label={t("forms.name")} value={service.name} />
            <InfoRow
              label={t("services.category")}
              value={t(`serviceCategories.${service.category}`)}
            />
            <InfoRow
              label={t("services.protocol")}
              value={<Badge variant="secondary">{service.protocol}</Badge>}
            />
            <InfoRow label={t("services.serviceId")} mono value={service.id} />
            <InfoRow
              label={t("activity.created")}
              value={formatDateTime(service.createdAt)}
            />
            <InfoRow
              label={t("services.updated")}
              value={formatDateTime(service.updatedAt)}
            />
          </InfoList>
        </div>
      </PageSection>

      <PageSection
        description={t("services.metadataDescription")}
        title={t("services.metadata")}
      >
        <div className="space-y-4">
          <Tags service={service} />
          <div>
            <div className="text-sm text-muted-foreground">{t("services.notes")}</div>
            <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm leading-6">
              {service.notes || t("common.none")}
            </p>
          </div>
        </div>
      </PageSection>
    </DetailLayout>
  );
}

export default function ServiceDetailPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const params = useParams<{ id?: string | string[] }>();
  const id = getParamId(params.id);
  const serviceQuery = useService(id);
  const serversQuery = useServers({ size: 100, sort: "name,asc" });
  const servers = serversQuery.data?.content ?? [];
  const router = useRouter();
  const service = serviceQuery.data;
  const isNotFound =
    serviceQuery.error instanceof ServiceApiError && serviceQuery.error.status === 404;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button
                disabled={serviceQuery.isFetching}
                onClick={() => void serviceQuery.refetch()}
                variant="outline"
              >
                <RefreshCw
                  className={cn("size-4", serviceQuery.isFetching && "animate-spin")}
                />
                {t("actions.refresh")}
              </Button>
              {service?.url ? (
                <Button asChild variant="outline">
                  <a href={service.url} rel="noreferrer" target="_blank">
                    <ExternalLink className="size-4" />
                    {t("actions.open")}
                  </a>
                </Button>
              ) : null}
              {service && canUpdateServices(session?.user.permissions) ? (
                <EditServiceDialog servers={servers} service={service} />
              ) : null}
              {service && canDeleteServices(session?.user.permissions) ? (
                <DeleteServiceDialog
                  onDeleted={() => router.push("/services")}
                  service={service}
                />
              ) : null}
            </>
          }
          badge={
            service ? (
              <Badge variant="secondary">
                {t(`serviceCategories.${service.category}`)}
              </Badge>
            ) : null
          }
          eyebrow={
            <PageHeaderBackLink href="/services">
              {t("services.title")}
            </PageHeaderBackLink>
          }
          subtitle={
            service
              ? hostEndpoint(service, t("common.unassigned"))
              : t("services.detailSubtitle", { id: id || "[id]" })
          }
          title={service?.name ?? t("services.detailTitle")}
        />

        {serviceQuery.isLoading ? <ServiceDetailSkeleton /> : null}
        {serviceQuery.isError && isNotFound ? <NotFoundState /> : null}
        {serviceQuery.isError && !isNotFound ? (
          <ServiceErrorState
            message={
              serviceQuery.error instanceof Error
                ? serviceQuery.error.message
                : t("services.unexpectedError")
            }
            onRetry={() => void serviceQuery.refetch()}
          />
        ) : null}
        {serviceQuery.isSuccess ? <ServiceDetail service={serviceQuery.data} /> : null}
      </div>
    </AppShell>
  );
}
