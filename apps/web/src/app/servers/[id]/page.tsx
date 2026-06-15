"use client";

import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Cpu,
  Fingerprint,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  TagsIcon,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCallback, useState, type ReactNode } from "react";
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
import { AgentEnrollmentToken } from "@/features/agents/agent-enrollment-token";
import { AgentStatusBadge } from "@/features/agents/agent-status-badge";
import { DecommissionAgentDialog } from "@/features/agents/decommission-agent-dialog";
import { RegisterAgentDialog } from "@/features/agents/register-agent-dialog";
import {
  useAgents,
  useCancelAgentEnrollment,
  useRotateAgentToken,
} from "@/features/agents/use-agents";
import { DeleteServerDialog } from "@/features/servers/delete-server-dialog";
import { EditServerDialog } from "@/features/servers/edit-server-dialog";
import { ServerErrorState } from "@/features/servers/server-error-state";
import { ServerStatusBadge } from "@/features/servers/server-status-badge";
import { useServer } from "@/features/servers/use-servers";
import type { Agent, AgentEnrollment } from "@/lib/api/agents";
import { ApiError, type ServerInventoryItem } from "@/lib/api/servers";
import {
  canDeleteServers,
  canCancelAgentEnrollments,
  canDecommissionAgents,
  canEnrollAgents,
  canRotateAgentTokens,
  canUpdateServers,
} from "@/lib/permissions";
import { formatBytes, formatUptime } from "@/features/servers/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function TimestampValue({ value }: { value: string | null | undefined }) {
  const t = useTranslations();

  return (
    <span className="grid gap-1">
      <span>{formatDetailDateTime(value)}</span>
      {value ? (
        <span className="text-xs text-muted-foreground">
          {formatRelativeLastSeen(value, t)}
        </span>
      ) : null}
    </span>
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
  const t = useTranslations("servers");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notFoundTitle")}</CardTitle>
        <CardDescription>
          {t("notFoundDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href="/servers">
            <ArrowLeft className="size-4" />
            {t("backToServers")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function Tags({ server }: { server: ServerInventoryItem }) {
  const t = useTranslations();

  if (server.tags.length === 0) {
    return <span className="text-muted-foreground">{t("common.none")}</span>;
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

function formatRelativeLastSeen(
  value: string | null | undefined,
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
  if (elapsedMinutes < 60) {
    return t("time.minutesAgo", { count: elapsedMinutes });
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return t("time.hoursAgo", { count: elapsedHours });
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return t("time.daysAgo", { count: elapsedDays });
}

function HostFactsSection({ server }: { server: ServerInventoryItem }) {
  const t = useTranslations();
  const facts = server.hostFacts;

  if (!facts) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="size-4" />
            {t("hostFacts.title")}
          </CardTitle>
          <CardDescription>
            {t("hostFacts.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
            {t("hostFacts.emptyDescription")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DetailSection
      title={t("hostFacts.title")}
      description={t("hostFacts.description")}
      icon={<HardDrive className="size-4 text-muted-foreground" />}
    >
      <Field
        label={t("forms.operatingSystem")}
        value={facts.operatingSystem ?? t("common.unknown")}
        muted={!facts.operatingSystem}
      />
      <Field
        label={t("hostFacts.platform")}
        value={
          <div className="grid gap-1">
            <span>{facts.platform ?? t("common.unknown")}</span>
            {facts.kernelVersion ? (
              <span className="font-mono text-xs text-muted-foreground">
                {t("hostFacts.kernelVersion", { version: facts.kernelVersion })}
              </span>
            ) : null}
          </div>
        }
        muted={!facts.platform}
      />
      <Field
        label={t("hostFacts.architecture")}
        value={facts.architecture ?? t("common.unknown")}
        muted={!facts.architecture}
      />
      <Field
        label={t("hostFacts.cpu")}
        value={
          facts.cpuCount
            ? t("hostFacts.logicalCpus", { count: facts.cpuCount })
            : t("common.unknown")
        }
        muted={!facts.cpuCount}
      />
      <Field
        label={t("hostFacts.memoryTotal")}
        value={formatBytes(facts.memoryTotalBytes)}
        muted={facts.memoryTotalBytes === null}
      />
      <Field
        label={t("hostFacts.disk")}
        value={
          <div className="grid gap-1">
            <span>{t("hostFacts.diskTotal", { value: formatBytes(facts.diskTotalBytes) })}</span>
            <span className="text-xs text-muted-foreground">
              {t("hostFacts.diskFree", { value: formatBytes(facts.diskFreeBytes) })}
            </span>
          </div>
        }
        muted={facts.diskTotalBytes === null}
      />
      <Field
        label={t("hostFacts.uptime")}
        value={formatUptime(facts.uptimeSeconds)}
        muted={facts.uptimeSeconds === null}
      />
      <Field
        label={t("networkMap.ipAddresses")}
        value={
          facts.ipAddresses.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {facts.ipAddresses.map((address) => (
                <Badge key={address} variant="secondary">
                  {address}
                </Badge>
              ))}
            </div>
          ) : (
            t("common.unknown")
          )
        }
        muted={facts.ipAddresses.length === 0}
      />
      <Field
        label={t("hostFacts.agentVersion")}
        value={facts.agentVersion ?? t("common.unknown")}
        muted={!facts.agentVersion}
      />
      <Field
        label={t("hostFacts.collectedAt")}
        value={formatDetailDateTime(facts.collectedAt)}
        muted={!facts.collectedAt}
      />
    </DetailSection>
  );
}

function AgentSection({
  actions,
  agent,
  isLoading,
  server,
}: {
  actions: {
    canCancelEnrollment: boolean;
    canDecommission: boolean;
    canEnroll: boolean;
    canRotateToken: boolean;
  };
  agent?: Agent;
  isLoading: boolean;
  server: ServerInventoryItem;
}) {
  const t = useTranslations();
  const [enrollment, setEnrollment] = useState<AgentEnrollment | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);
  const rotateAgentToken = useRotateAgentToken();
  const cancelAgentEnrollment = useCancelAgentEnrollment();
  const handleAgentConnectionChange = useCallback((connected: boolean) => {
    setAgentConnected(connected);
  }, []);
  const pending = agent?.status === "PENDING" && agent.lastSeenAt === null;
  const offline = agent?.status === "OFFLINE";
  const canDecommission =
    agent?.status === "ONLINE" || agent?.status === "OFFLINE";

  async function rotateToken() {
    if (!agent) {
      return;
    }

    try {
      const rotated = await rotateAgentToken.mutateAsync(agent.id);
      setAgentConnected(false);
      setEnrollment(rotated);
      toast.success(t("agents.tokenRotatedToast"), {
        description: rotated.agent.name,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("agents.rotateTokenFailedDescription");
      toast.error(t("agents.rotateTokenFailedToast"), {
        description: message,
      });
    }
  }

  async function cancelEnrollment() {
    if (!agent) {
      return;
    }

    const confirmed = window.confirm(
      t("agents.cancelEnrollmentConfirm")
    );
    if (!confirmed) {
      return;
    }

    try {
      await cancelAgentEnrollment.mutateAsync(agent.id);
      toast.success(t("agents.enrollmentCanceledToast"), {
        description: agent.name,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("agents.cancelEnrollmentFailedDescription");
      toast.error(t("agents.cancelEnrollmentFailedToast"), {
        description: message,
      });
    }
  }

  function closeTokenDialog() {
    setEnrollment(null);
    setAgentConnected(false);
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4" />
          {t("help.agentSetup")}
        </CardTitle>
        <CardDescription>
          {t("agents.setupDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}
        {!isLoading && agent ? (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <AgentStatusBadge status={agent.status} />
                  <span className="text-sm font-medium">{agent.name}</span>
                </div>
                {pending ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("agents.pendingTokenDescription")}
                  </p>
                ) : null}
                {offline ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("agents.offlineDescription")}
                  </p>
                ) : null}
                {agent.status === "ONLINE" ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("agents.onlineDescription")}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {actions.canRotateToken && agent.status !== "DECOMMISSIONED" ? (
                  <Button
                    type="button"
                    variant={pending ? "default" : "outline"}
                    disabled={rotateAgentToken.isPending}
                    onClick={() => void rotateToken()}
                  >
                    {rotateAgentToken.isPending ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Terminal className="size-4" />
                    )}
                    {pending
                      ? t("agents.generateSetupToken")
                      : t("agents.rotateToken")}
                  </Button>
                ) : null}
                {actions.canCancelEnrollment && pending ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={cancelAgentEnrollment.isPending}
                    onClick={() => void cancelEnrollment()}
                  >
                    {cancelAgentEnrollment.isPending ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : null}
                    {t("agents.cancelEnrollment")}
                  </Button>
                ) : null}
                {actions.canDecommission && agent && canDecommission ? (
                  <DecommissionAgentDialog agent={agent} />
                ) : null}
                <Button asChild type="button" variant="outline">
                  <Link href={`/agents/${agent.id}`}>
                    {t("agents.viewAgent")}
                  </Link>
                </Button>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label={t("agents.agentHostname")} value={agent.hostname} mono />
              <Field label={t("agents.version")} value={agent.version} mono />
              <Field
                label={t("agents.lastHeartbeat")}
                value={<TimestampValue value={agent.lastSeenAt} />}
                muted={!agent.lastSeenAt}
              />
              <Field
                label={t("services.linkedServer")}
                value={`${server.name} / ${server.hostname}`}
              />
              <Field label={t("agents.agentId")} value={agent.id} mono />
            </dl>
          </div>
        ) : null}
        {!isLoading && !agent ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">
              {t("agents.installDescription")}
            </p>
            {actions.canEnroll ? (
              <RegisterAgentDialog
                initialServer={server}
                triggerLabel={t("agents.enrollAgent")}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
      <Dialog
        open={Boolean(enrollment)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && enrollment && !agentConnected) {
            return;
          }
          if (!nextOpen) {
            closeTokenDialog();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          showCloseButton={!enrollment || agentConnected}
          onEscapeKeyDown={(event) => {
            if (enrollment && !agentConnected) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (enrollment && !agentConnected) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("agents.agentToken")}</DialogTitle>
            <DialogDescription>{t("servers.tokenShownOnce")}</DialogDescription>
          </DialogHeader>
          {enrollment ? (
            <AgentEnrollmentToken
              allowCancelEnrollment={
                enrollment.agent.status === "PENDING" &&
                enrollment.agent.lastSeenAt === null
              }
              enrollment={enrollment}
              onClose={closeTokenDialog}
              onConnectionChange={handleAgentConnectionChange}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ServerDetails({
  canDelete,
  agentActions,
  canUpdateServer,
  linkedAgent,
  linkedAgentLoading,
  server,
}: {
  canDelete: boolean;
  agentActions: {
    canCancelEnrollment: boolean;
    canDecommission: boolean;
    canEnroll: boolean;
    canRotateToken: boolean;
  };
  canUpdateServer: boolean;
  linkedAgent?: Agent;
  linkedAgentLoading: boolean;
  server: ServerInventoryItem;
}) {
  const t = useTranslations();
  const description = server.description.trim();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Server className="size-4" />
                {t("servers.inventoryRecord")}
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
              {canUpdateServer ? (
                <EditServerDialog server={server} triggerLabel={t("actions.edit")} />
              ) : null}
              {canDelete ? (
                <DeleteServerDialog server={server} triggerLabel={t("actions.delete")} />
              ) : null}
              <Button asChild variant="outline">
                <Link href="/servers">
                  <ArrowLeft className="size-4" />
                  {t("servers.backToServers")}
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {description || t("servers.noDescriptionProvided")}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection
          title={t("servers.identity")}
          description={t("servers.identityDescription")}
          icon={<Fingerprint className="size-4 text-muted-foreground" />}
        >
          <Field label={t("forms.name")} value={server.name} />
          <Field
            label={t("forms.status")}
            value={
              <div className="grid gap-2">
                <ServerStatusBadge status={server.status} />
                <span className="text-xs text-muted-foreground">
                  {t("servers.statusManagedByAgent")}
                </span>
              </div>
            }
          />
          <Field
            label={t("forms.description")}
            value={description || t("servers.noDescription")}
            muted={!description}
          />
        </DetailSection>

        <DetailSection
          title={t("servers.network")}
          description={t("servers.networkDescription")}
          icon={<Network className="size-4 text-muted-foreground" />}
        >
          <Field label={t("forms.hostname")} value={server.hostname} mono />
          <Field label={t("forms.ipAddress")} value={server.ipAddress} mono />
        </DetailSection>

        <DetailSection
          title={t("forms.operatingSystem")}
          description={t("servers.operatingSystemDescription")}
          icon={<Cpu className="size-4 text-muted-foreground" />}
        >
          <Field
            label={t("forms.operatingSystem")}
            value={server.operatingSystem || t("common.unknown")}
            muted={!server.operatingSystem}
          />
        </DetailSection>

        <AgentSection
          actions={agentActions}
          agent={linkedAgent}
          isLoading={linkedAgentLoading}
          server={server}
        />

        <HostFactsSection server={server} />

        <DetailSection
          title={t("forms.tags")}
          description={t("servers.tagsDescription")}
          icon={<TagsIcon className="size-4 text-muted-foreground" />}
        >
          <Field label={t("forms.tags")} value={<Tags server={server} />} />
        </DetailSection>

        <div className="xl:col-span-2">
          <DetailSection
            title={t("servers.timestamps")}
            description={t("servers.timestampsDescription")}
            icon={<CalendarClock className="size-4 text-muted-foreground" />}
          >
            <Field
              label={t("servers.lastSeenHeader")}
              value={<TimestampValue value={server.lastSeenAt} />}
              muted={!server.lastSeenAt}
            />
            <Field
              label={t("activity.created")}
              value={formatDetailDateTime(server.createdAt)}
            />
            <Field
              label={t("services.updated")}
              value={formatDetailDateTime(server.updatedAt)}
            />
            <Field label={t("servers.recordId")} value={server.id} mono />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}

export default function ServerDetailPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const params = useParams<{ id?: string | string[] }>();
  const id = getParamId(params.id);
  const serverQuery = useServer(id);
  const agentsQuery = useAgents({ size: 200 });
  const linkedAgent = agentsQuery.data?.content.find(
    (agent) => agent.serverId === id
  );
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
                {t("navigation.servers")}
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("servers.detailTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("servers.detailSubtitle", { id: id || "[id]" })}
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
            {t("actions.refresh")}
          </Button>
        </div>

        {serverQuery.isLoading ? <ServerDetailSkeleton /> : null}
        {serverQuery.isError && isNotFound ? <NotFoundState /> : null}
        {serverQuery.isError && !isNotFound ? (
          <ServerErrorState
            message={
              serverQuery.error instanceof Error
                ? serverQuery.error.message
                : t("servers.unexpectedError")
            }
            onRetry={() => void serverQuery.refetch()}
          />
        ) : null}
        {serverQuery.isSuccess ? (
          <ServerDetails
            canDelete={canDeleteServers(session?.user.permissions)}
            agentActions={{
              canCancelEnrollment: canCancelAgentEnrollments(session?.user.permissions),
              canDecommission: canDecommissionAgents(session?.user.permissions),
              canEnroll: canEnrollAgents(session?.user.permissions),
              canRotateToken: canRotateAgentTokens(session?.user.permissions),
            }}
            canUpdateServer={canUpdateServers(session?.user.permissions)}
            linkedAgent={linkedAgent}
            linkedAgentLoading={agentsQuery.isLoading}
            server={serverQuery.data}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
