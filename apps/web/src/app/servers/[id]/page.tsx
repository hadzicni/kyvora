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
  return (
    <span className="grid gap-1">
      <span>{formatDetailDateTime(value)}</span>
      {value ? (
        <span className="text-xs text-muted-foreground">
          {formatRelativeLastSeen(value)}
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

function formatRelativeLastSeen(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  const elapsedMs = Date.now() - new Date(value).getTime();
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60_000));

  if (elapsedMinutes < 1) {
    return "Just now";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return `${elapsedDays} d ago`;
}

function HostFactsSection({ server }: { server: ServerInventoryItem }) {
  const facts = server.hostFacts;

  if (!facts) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="size-4" />
            Host Facts
          </CardTitle>
          <CardDescription>
            Latest inventory snapshot reported by the linked agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
            Host facts will appear after the agent sends its first heartbeat.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DetailSection
      title="Host Facts"
      description="Latest inventory snapshot reported by the linked agent."
      icon={<HardDrive className="size-4 text-muted-foreground" />}
    >
      <Field
        label="Operating system"
        value={facts.operatingSystem ?? "Unknown"}
        muted={!facts.operatingSystem}
      />
      <Field
        label="Platform"
        value={
          <div className="grid gap-1">
            <span>{facts.platform ?? "Unknown"}</span>
            {facts.kernelVersion ? (
              <span className="font-mono text-xs text-muted-foreground">
                kernel {facts.kernelVersion}
              </span>
            ) : null}
          </div>
        }
        muted={!facts.platform}
      />
      <Field
        label="Architecture"
        value={facts.architecture ?? "Unknown"}
        muted={!facts.architecture}
      />
      <Field
        label="CPU"
        value={
          facts.cpuCount ? `${facts.cpuCount} logical CPUs` : "Unknown"
        }
        muted={!facts.cpuCount}
      />
      <Field
        label="Memory total"
        value={formatBytes(facts.memoryTotalBytes)}
        muted={facts.memoryTotalBytes === null}
      />
      <Field
        label="Disk"
        value={
          <div className="grid gap-1">
            <span>{formatBytes(facts.diskTotalBytes)} total</span>
            <span className="text-xs text-muted-foreground">
              {formatBytes(facts.diskFreeBytes)} free
            </span>
          </div>
        }
        muted={facts.diskTotalBytes === null}
      />
      <Field
        label="Uptime"
        value={formatUptime(facts.uptimeSeconds)}
        muted={facts.uptimeSeconds === null}
      />
      <Field
        label="IP addresses"
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
            "Unknown"
          )
        }
        muted={facts.ipAddresses.length === 0}
      />
      <Field
        label="Agent version"
        value={facts.agentVersion ?? "Unknown"}
        muted={!facts.agentVersion}
      />
      <Field
        label="Collected at"
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
      toast.success("Agent token rotated.", {
        description: rotated.agent.name,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to rotate the agent token right now.";
      toast.error("Unable to rotate token.", {
        description: message,
      });
    }
  }

  async function cancelEnrollment() {
    if (!agent) {
      return;
    }

    const confirmed = window.confirm(
      "This will revoke the token and remove the pending agent. You can enroll a new agent later."
    );
    if (!confirmed) {
      return;
    }

    try {
      await cancelAgentEnrollment.mutateAsync(agent.id);
      toast.success("Enrollment canceled.", {
        description: agent.name,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to cancel enrollment right now.";
      toast.error("Unable to cancel enrollment.", {
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
          Agent Setup
        </CardTitle>
        <CardDescription>
          Install and operate the Kyvora Agent for live server status.
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
                    The one-time token is no longer visible. Rotate token to
                    generate a new setup command.
                  </p>
                ) : null}
                {offline ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    No heartbeat has been received recently. Check whether the
                    agent process and server are running.
                  </p>
                ) : null}
                {agent.status === "ONLINE" ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    The linked agent is reporting live status for this server.
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
                    {pending ? "Generate setup token" : "Rotate token"}
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
                    Cancel enrollment
                  </Button>
                ) : null}
                {actions.canDecommission && agent && canDecommission ? (
                  <DecommissionAgentDialog agent={agent} />
                ) : null}
                <Button asChild type="button" variant="outline">
                  <Link href={`/agents/${agent.id}`}>View agent</Link>
                </Button>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Agent hostname" value={agent.hostname} mono />
              <Field label="Version" value={agent.version} mono />
              <Field
                label="Last heartbeat"
                value={<TimestampValue value={agent.lastSeenAt} />}
                muted={!agent.lastSeenAt}
              />
              <Field
                label="Linked server"
                value={`${server.name} / ${server.hostname}`}
              />
              <Field label="Agent ID" value={agent.id} mono />
            </dl>
          </div>
        ) : null}
        {!isLoading && !agent ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">
              Install a Kyvora Agent on this server to report live status and
              heartbeats.
            </p>
            {actions.canEnroll ? (
              <RegisterAgentDialog
                initialServer={server}
                triggerLabel="Enroll Agent"
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
            <DialogTitle>Agent token</DialogTitle>
            <DialogDescription>This token is shown only once.</DialogDescription>
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
              {canUpdateServer ? (
                <EditServerDialog server={server} triggerLabel="Edit" />
              ) : null}
              {canDelete ? (
                <DeleteServerDialog server={server} triggerLabel="Delete" />
              ) : null}
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
            value={
              <div className="grid gap-2">
                <ServerStatusBadge status={server.status} />
                <span className="text-xs text-muted-foreground">
                  Status is managed by the linked agent.
                </span>
              </div>
            }
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

        <AgentSection
          actions={agentActions}
          agent={linkedAgent}
          isLoading={linkedAgentLoading}
          server={server}
        />

        <HostFactsSection server={server} />

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
              value={<TimestampValue value={server.lastSeenAt} />}
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
