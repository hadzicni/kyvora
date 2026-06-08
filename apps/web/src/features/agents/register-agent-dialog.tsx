"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Loader2, Plus, Server, Terminal } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AgentApiError,
  type AgentEnrollment,
  type RegisterAgentInput,
} from "@/lib/api/agents";
import type { ServerInventoryItem } from "@/lib/api/servers";

import { useAgents, useRegisterAgent } from "./use-agents";
import { useServers } from "../servers/use-servers";

const defaultAgentApiUrl = "http://localhost:8080";

const registerAgentSchema = z.object({
  serverId: z.string().min(1, "Select a server."),
  name: z
    .string()
    .trim()
    .max(120, "Name must be 120 characters or fewer.")
    .optional()
    .refine((value) => !value || value.length >= 2, {
      message: "Name must be at least 2 characters.",
    }),
});

type RegisterAgentFormValues = z.input<typeof registerAgentSchema>;
type RegisterAgentPayload = z.output<typeof registerAgentSchema>;
type RegisterAgentField = keyof RegisterAgentFormValues;

function defaultRegisterAgentValues(
  server?: ServerInventoryItem
): RegisterAgentFormValues {
  return {
    serverId: server?.id ?? "",
    name: server ? `${server.name} Agent` : "",
  };
}

function toRegisterAgentInput(
  payload: RegisterAgentPayload
): RegisterAgentInput {
  return {
    serverId: payload.serverId,
    name: payload.name?.trim() || undefined,
  };
}

export function RegisterAgentDialog({
  initialServer,
  triggerLabel = "Register agent",
}: {
  initialServer?: ServerInventoryItem;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<AgentEnrollment | null>(null);
  const [copied, setCopied] = useState<"token" | "command" | null>(null);
  const registerAgent = useRegisterAgent();
  const serversQuery = useServers({ size: 100 });
  const agentsQuery = useAgents({ size: 200 });
  const form = useForm<
    RegisterAgentFormValues,
    unknown,
    RegisterAgentPayload
  >({
    resolver: zodResolver(registerAgentSchema),
    defaultValues: defaultRegisterAgentValues(initialServer),
  });
  const {
    formState: { errors },
    register,
    setValue,
  } = form;
  const selectedServerId =
    useWatch({ control: form.control, name: "serverId" }) ?? "";

  const servers = useMemo(() => {
    const content = serversQuery.data?.content ?? [];
    if (!initialServer || content.some((server) => server.id === initialServer.id)) {
      return content;
    }
    return [initialServer, ...content];
  }, [initialServer, serversQuery.data?.content]);

  const assignedServerIds = useMemo(
    () =>
      new Set(
        (agentsQuery.data?.content ?? [])
          .map((agent) => agent.serverId)
          .filter((serverId): serverId is string => Boolean(serverId))
      ),
    [agentsQuery.data?.content]
  );
  const selectedServer = servers.find((server) => server.id === selectedServerId);
  const isLoadingServers = serversQuery.isLoading || agentsQuery.isLoading;
  const hasNoServers = serversQuery.isSuccess && servers.length === 0;

  async function onSubmit(values: RegisterAgentPayload) {
    setFormError(null);

    try {
      const enrolled = await registerAgent.mutateAsync(toRegisterAgentInput(values));
      form.reset(defaultRegisterAgentValues(initialServer));
      setEnrollment(enrolled);
      toast.success("Agent enrolled.", {
        description: enrolled.agent.name,
      });
    } catch (error) {
      if (error instanceof AgentApiError && error.status === 409) {
        const message = "The selected server already has an agent.";
        setFormError(message);
        toast.error("Unable to enroll agent.", {
          description: message,
        });
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to register the agent right now.";

      setFormError(message);
      toast.error("Unable to enroll agent.", {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(defaultRegisterAgentValues(initialServer));
      setFormError(null);
      setEnrollment(null);
      setCopied(null);
    }
  }

  function handleServerChange(serverId: string) {
    const server = servers.find((entry) => entry.id === serverId);
    setValue("serverId", serverId, { shouldDirty: true, shouldValidate: true });
    if (server) {
      setValue("name", `${server.name} Agent`, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function copyValue(kind: "token" | "command", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const runCommand = enrollment
    ? `KYVORA_API_URL=${defaultAgentApiUrl} \\
KYVORA_AGENT_ID=${enrollment.agent.id} \\
KYVORA_AGENT_TOKEN=${enrollment.agentToken} \\
npm run dev:agent`
    : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{enrollment ? "Agent token" : "Enroll agent"}</DialogTitle>
          <DialogDescription>
            {enrollment
              ? "This token is shown only once."
              : "Create an agent for a server and generate a one-time enrollment token."}
          </DialogDescription>
        </DialogHeader>

        {enrollment ? (
          <div className="grid gap-4">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              This token is shown only once. Store it securely before closing
              this dialog.
            </div>

            <TokenDetail label="Agent ID" value={enrollment.agent.id} />
            <TokenDetail label="API Server URL" value={defaultAgentApiUrl} />

            <div className="grid gap-2">
              <Label>Agent Token</Label>
              <div className="flex min-w-0 gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs">
                  {enrollment.agentToken}
                </code>
                <Button
                  aria-label="Copy agent token"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => void copyValue("token", enrollment.agentToken)}
                >
                  {copied === "token" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Run command</Label>
              <div className="rounded-md border bg-muted">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <Terminal className="size-4 text-muted-foreground" />
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => void copyValue("command", runCommand)}
                  >
                    {copied === "command" ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    Copy command
                  </Button>
                </div>
                <pre className="overflow-x-auto p-3 text-xs">
                  <code>{runCommand}</code>
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          >
            {formError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <FormField
              error={errors.serverId?.message}
              htmlFor="register-agent-server"
              label="Server"
            >
              <Select
                disabled={isLoadingServers || hasNoServers}
                onValueChange={handleServerChange}
                value={selectedServerId}
              >
                <SelectTrigger
                  id="register-agent-server"
                  className="h-auto min-h-10 w-full justify-between"
                  aria-invalid={Boolean(errors.serverId)}
                >
                  <SelectValue
                    placeholder={
                      isLoadingServers ? "Loading servers..." : "Select server"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {servers.map((server) => {
                    const isAssigned =
                      assignedServerIds.has(server.id) &&
                      server.id !== selectedServerId;

                    return (
                      <SelectItem
                        disabled={isAssigned}
                        key={server.id}
                        value={server.id}
                      >
                        {server.name} / {server.hostname} / {server.ipAddress}
                        {isAssigned ? " / assigned" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedServer ? (
                <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <Server className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {selectedServer.name}
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {selectedServer.hostname} / {selectedServer.ipAddress}
                    </div>
                  </div>
                </div>
              ) : null}
              {hasNoServers ? (
                <p className="text-xs text-muted-foreground">
                  Create a server inventory entry before enrolling an agent.
                </p>
              ) : null}
            </FormField>

            <FormField
              error={errors.name?.message}
              htmlFor="register-agent-name"
              label="Name"
            >
              <Input
                id="register-agent-name"
                placeholder={selectedServer ? `${selectedServer.name} Agent` : "Node Agent"}
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </FormField>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={registerAgent.isPending || isLoadingServers || hasNoServers}
              >
                {registerAgent.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Enroll agent
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TokenDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <code className="overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs">
        {value}
      </code>
    </div>
  );
}

function FormField({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: RegisterAgentField | string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
