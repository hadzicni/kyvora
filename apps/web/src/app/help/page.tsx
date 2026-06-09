"use client";

import {
  Activity,
  BadgeCheck,
  BookOpen,
  CircleHelp,
  ExternalLink,
  GitBranch,
  HeartPulse,
  LifeBuoy,
  RotateCw,
  Server,
  Settings,
  ShieldCheck,
  Terminal,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getInstanceSettings } from "@/lib/api/settings";
import { getStatus, statusKeys } from "@/lib/api/status";

const repositoryUrl = "https://github.com/hadzicni/kyvora";
const releasesUrl = `${repositoryUrl}/releases`;
const releaseDocsUrl = `${repositoryUrl}/blob/main/docs/RELEASE.md`;

function displayVersion(version?: string) {
  if (!version || version.toLowerCase() === "unknown") {
    return "Version unavailable";
  }

  return `Kyvora v${version}`;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/20 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function GuidanceItem({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex gap-3 rounded-md border bg-muted/20 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md border bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
      <code>{children}</code>
    </pre>
  );
}

export default function HelpPage() {
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
              Operator guide
            </Badge>
          }
          eyebrow={
            <>
              <CircleHelp className="size-4" />
              Reference
            </>
          }
          subtitle="Operational reference for running Kyvora, enrolled agents, server state, activity records, and release metadata."
          title="Help"
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-4" />
                  About {instance.name}
                </CardTitle>
                <CardDescription>
                  {instance.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <InfoRow
                  label="Product"
                  value={instance.name}
                />
                <InfoRow
                  label="Version"
                  value={
                    statusQuery.isLoading ? (
                      <Skeleton className="ml-auto h-4 w-24" />
                    ) : (
                      displayVersion(status?.version)
                    )
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="size-4" />
                  Agent Setup
                </CardTitle>
                <CardDescription>
                  Current lifecycle for enrolling a Kyvora Agent with a server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <GuidanceItem icon={Server}>
                    Create or select a server, then enroll an agent for that
                    server from the Agent Setup card.
                  </GuidanceItem>
                  <GuidanceItem icon={Terminal}>
                    Copy the one-time command and run the Go agent with the API
                    URL, agent ID, and agent token.
                  </GuidanceItem>
                  <GuidanceItem icon={ShieldCheck}>
                    The token is shown once. Tokens can be rotated from the
                    server detail Agent Setup card.
                  </GuidanceItem>
                  <GuidanceItem icon={RotateCw}>
                    Pending enrollments can be canceled before the first
                    heartbeat is accepted.
                  </GuidanceItem>
                </div>
                <CodeBlock>{`KYVORA_API_URL=http://localhost:8080
KYVORA_AGENT_ID=<agent-id>
KYVORA_AGENT_TOKEN=<one-time-token>`}</CodeBlock>
                <p className="text-sm leading-6 text-muted-foreground">
                  Agent status becomes ONLINE after the first heartbeat. The
                  linked server status is agent-managed, and both agent and
                  server become OFFLINE when heartbeats are missed beyond the
                  offline threshold.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="size-4" />
                    Server Status Guide
                  </CardTitle>
                  <CardDescription>
                    Server status is not manually editable once managed by an
                    agent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border bg-muted/20 p-3">
                    <Badge variant="outline">UNKNOWN</Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No agent heartbeat has been received yet, or operational
                      state is not known.
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <Badge className="border-emerald-500/30 text-emerald-300" variant="outline">
                      ONLINE
                    </Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      A linked agent is reporting heartbeats.
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <Badge className="border-red-500/30 text-red-300" variant="outline">
                      OFFLINE
                    </Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The agent missed heartbeats, or the server or agent is
                      down.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="size-4" />
                    Activity / Audit
                  </CardTitle>
                  <CardDescription>
                    Lifecycle and security-relevant events for operators.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GuidanceItem icon={Activity}>
                    Activity records server, agent, token, and lifecycle events
                    that are useful for operational review.
                  </GuidanceItem>
                  <GuidanceItem icon={ShieldCheck}>
                    Tokens and token hashes are never logged.
                  </GuidanceItem>
                  <GuidanceItem icon={HeartPulse}>
                    Heartbeats are not logged repeatedly. Activity focuses on
                    lifecycle transitions instead.
                  </GuidanceItem>
                  <GuidanceItem icon={Settings}>
                    ADMIN can change operational settings such as instance
                    metadata and agent monitoring windows from Settings.
                  </GuidanceItem>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-4" />
                    User Access
                  </CardTitle>
                  <CardDescription>
                    Local accounts use Kyvora credentials and role-based access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GuidanceItem icon={ShieldCheck}>
                    ADMIN has full administration, including users, settings,
                    servers, agents, and activity.
                  </GuidanceItem>
                  <GuidanceItem icon={Terminal}>
                    OPERATOR can manage servers and agents, and can view
                    dashboard, activity, help, and profile.
                  </GuidanceItem>
                  <GuidanceItem icon={BadgeCheck}>
                    VIEWER has read-only access to dashboard, servers, agents,
                    activity, help, and profile.
                  </GuidanceItem>
                  <GuidanceItem icon={BadgeCheck}>
                    All roles can change their own password from Profile when
                    supported.
                  </GuidanceItem>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="size-4" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Live status from the authenticated Kyvora API status endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-3">
                  <BadgeCheck
                    className={
                      statusQuery.isError
                        ? "size-4 text-destructive"
                        : "size-4 text-emerald-400"
                    }
                  />
                  <div>
                    <div className="text-sm font-medium">API status</div>
                    <div className="text-sm text-muted-foreground">
                      {statusQuery.isLoading
                        ? "Checking..."
                        : statusQuery.isError
                          ? "Unavailable"
                          : "Healthy"}
                    </div>
                  </div>
                </div>
                <InfoRow label="Service" value={status?.service ?? "Unavailable"} />
                <InfoRow
                  label="API version"
                  value={
                    statusQuery.isLoading
                      ? "Loading..."
                      : status?.version && status.version !== "unknown"
                        ? status.version
                        : "Unavailable"
                  }
                />
                <InfoRow
                  label="Inventory API"
                  value={statusQuery.isError ? "Unavailable" : "Ready"}
                />
                <InfoRow
                  label="Generated"
                  value={
                    status?.generatedAt
                      ? new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(status.generatedAt))
                      : "Unavailable"
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="size-4" />
                  Release / Links
                </CardTitle>
                <CardDescription>
                  Project source, release artifacts, and release process notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-between" variant="outline">
                  <a href={repositoryUrl} rel="noreferrer" target="_blank">
                    GitHub repository
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button asChild className="w-full justify-between" variant="outline">
                  <a href={releasesUrl} rel="noreferrer" target="_blank">
                    GitHub releases
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button asChild className="w-full justify-between" variant="outline">
                  <a href={releaseDocsUrl} rel="noreferrer" target="_blank">
                    Release docs
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Separator />
                <p className="text-sm leading-6 text-muted-foreground">
                  Kyvora uses the root VERSION file as the release source of
                  truth and publishes GitHub Releases from versioned tags.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
