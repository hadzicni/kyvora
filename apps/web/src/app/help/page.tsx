"use client";

import {
  Activity,
  BadgeCheck,
  CircleHelp,
  ExternalLink,
  HeartPulse,
  LifeBuoy,
  RotateCw,
  Server,
  Settings,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { AppShell } from "@/components/app/app-shell";
import { DetailLayout } from "@/components/app/detail-layout";
import { PageHeader } from "@/components/app/page-header";
import { InfoList, InfoRow, PageSection } from "@/components/app/page-section";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getInstanceSettings } from "@/lib/api/settings";
import { getStatus, statusKeys } from "@/lib/api/status";

const repositoryUrl = "https://github.com/hadzicni/kyvora";
const releasesUrl = `${repositoryUrl}/releases`;
const releaseDocsUrl = `${repositoryUrl}/blob/main/docs/RELEASE.md`;

function GuidanceItem({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
      <div className="text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-surface-subtle p-3 text-xs leading-5 text-muted-foreground">
      <code>{children}</code>
    </pre>
  );
}

export default function HelpPage() {
  const t = useTranslations();
  const locale = useLocale();
  const statusQuery = useQuery({
    queryKey: statusKeys.status,
    queryFn: getStatus,
  });
  const instance = getInstanceSettings(undefined);
  const status = statusQuery.data;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            <Badge className="w-fit" variant="outline">
              <LifeBuoy className="size-3" />
              {t("help.operatorGuide")}
            </Badge>
          }
          eyebrow={
            <>
              <CircleHelp className="size-4" />
              {t("common.reference")}
            </>
          }
          subtitle={t("help.subtitle")}
          title={t("help.title")}
        />

        <DetailLayout
          aside={
            <>
              <PageSection
                description={t("help.systemStatusDescription")}
                title={t("help.systemStatus")}
              >
                <InfoList>
                  <InfoRow
                    label={t("navigation.apiStatus")}
                    value={
                      statusQuery.isLoading ? (
                        `${t("common.checking")}...`
                      ) : (
                        <StatusBadge tone={statusQuery.isError ? "danger" : "success"}>
                          {statusQuery.isError
                            ? t("common.unavailable")
                            : t("common.healthy")}
                        </StatusBadge>
                      )
                    }
                  />
                  <InfoRow
                    label="Service"
                    value={status?.service ?? t("common.unavailable")}
                  />
                  <InfoRow
                    label={t("help.apiVersion")}
                    mono
                    value={
                      statusQuery.isLoading
                        ? `${t("common.loading")}...`
                        : status?.version && status.version !== "unknown"
                          ? status.version
                          : t("common.unavailable")
                    }
                  />
                  <InfoRow
                    label={t("help.inventoryApi")}
                    value={
                      statusQuery.isError ? t("common.unavailable") : t("common.ready")
                    }
                  />
                  <InfoRow
                    label={t("help.generated")}
                    value={
                      status?.generatedAt
                        ? new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(status.generatedAt))
                        : t("common.unavailable")
                    }
                  />
                </InfoList>
              </PageSection>

              <PageSection
                description={t("help.releaseLinksDescription")}
                title={t("help.releaseLinks")}
              >
                <div className="space-y-2">
                  <Button asChild className="w-full justify-between" variant="outline">
                    <a href={repositoryUrl} rel="noreferrer" target="_blank">
                      {t("help.githubRepository")}
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button asChild className="w-full justify-between" variant="outline">
                    <a href={releasesUrl} rel="noreferrer" target="_blank">
                      {t("help.githubReleases")}
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button asChild className="w-full justify-between" variant="outline">
                    <a href={releaseDocsUrl} rel="noreferrer" target="_blank">
                      {t("help.releaseDocs")}
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <p className="pt-1 text-sm leading-6 text-muted-foreground">
                    Kyvora uses the root VERSION file as the release source of truth and
                    publishes GitHub Releases from versioned tags.
                  </p>
                </div>
              </PageSection>
            </>
          }
        >
          <PageSection
            description={instance.description}
            title={t("help.about", { name: instance.name })}
          >
            <InfoList className="max-w-xl">
              <InfoRow label={t("help.product")} value={instance.name} />
              <InfoRow
                label={t("help.version")}
                mono
                value={
                  statusQuery.isLoading ? (
                    <Skeleton className="ml-auto h-4 w-24" />
                  ) : status?.version && status.version !== "unknown" ? (
                    t("help.versionValue", { version: status.version })
                  ) : (
                    t("help.versionUnavailable")
                  )
                }
              />
            </InfoList>
          </PageSection>

          <PageSection
            description={t("help.agentSetupDescription")}
            title={t("help.agentSetup")}
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <GuidanceItem icon={Server}>
                  Create or select a server, then configure the agent base URL for that
                  server from the Agent Setup card.
                </GuidanceItem>
                <GuidanceItem icon={Terminal}>
                  Run the Go agent on the managed host with a private listen address,
                  port, and shared secret.
                </GuidanceItem>
                <GuidanceItem icon={ShieldCheck}>
                  Kyvora uses the shared secret when pulling data from the secured agent
                  HTTP API.
                </GuidanceItem>
                <GuidanceItem icon={RotateCw}>
                  Use Pull now to test connectivity and update status, capabilities, and
                  host facts.
                </GuidanceItem>
              </div>
              <CodeBlock>{`KYVORA_AGENT_LISTEN_ADDRESS=127.0.0.1
KYVORA_AGENT_LISTEN_PORT=9187
KYVORA_AGENT_SHARED_SECRET=<shared-secret>`}</CodeBlock>
              <p className="text-sm leading-6 text-muted-foreground">
                Agent status becomes ONLINE after a successful pull. The linked server
                status is agent-managed, and both agent and server become OFFLINE when
                pulls fail beyond the offline threshold.
              </p>
            </div>
          </PageSection>

          <PageSection
            description="Server status is not manually editable once managed by an agent."
            title="Server status guide"
          >
            <InfoList className="max-w-xl">
              <InfoRow
                label={<StatusBadge tone="warning">UNKNOWN</StatusBadge>}
                value={
                  <span className="text-muted-foreground">
                    No successful agent pull has completed yet.
                  </span>
                }
              />
              <InfoRow
                label={<StatusBadge tone="success">ONLINE</StatusBadge>}
                value={
                  <span className="text-muted-foreground">
                    A linked agent is reachable and returning current data.
                  </span>
                }
              />
              <InfoRow
                label={<StatusBadge tone="danger">OFFLINE</StatusBadge>}
                value={
                  <span className="text-muted-foreground">
                    Agent pulls are failing, or the server or agent is down.
                  </span>
                }
              />
            </InfoList>
          </PageSection>

          <PageSection
            description="Lifecycle and security-relevant events for operators."
            title="Activity and audit"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <GuidanceItem icon={Activity}>
                Activity records server, agent, pull, and lifecycle events for
                operational review.
              </GuidanceItem>
              <GuidanceItem icon={ShieldCheck}>
                Tokens and token hashes are never logged.
              </GuidanceItem>
              <GuidanceItem icon={HeartPulse}>
                Heartbeats are not logged repeatedly. Activity focuses on lifecycle
                transitions instead.
              </GuidanceItem>
              <GuidanceItem icon={Settings}>
                ADMIN can change operational settings such as instance metadata and
                agent monitoring windows from Settings.
              </GuidanceItem>
            </div>
          </PageSection>

          <PageSection
            description="Local accounts use Kyvora credentials and permission-based access."
            title="User access"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <GuidanceItem icon={ShieldCheck}>
                Admin is a preset for full administration permissions, including users,
                settings, servers, agents, and activity.
              </GuidanceItem>
              <GuidanceItem icon={Terminal}>
                Operator is a preset for managing servers and agents, with access to
                dashboard, activity, help, and profile.
              </GuidanceItem>
              <GuidanceItem icon={BadgeCheck}>
                Viewer is a preset for read-only operational access.
              </GuidanceItem>
              <GuidanceItem icon={BadgeCheck}>
                Authenticated users can change their own password from Profile when
                supported.
              </GuidanceItem>
            </div>
          </PageSection>
        </DetailLayout>
      </div>
    </AppShell>
  );
}
