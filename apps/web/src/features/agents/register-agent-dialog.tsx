"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Server } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { AgentApiError, type RegisterAgentInput } from "@/lib/api/agents";
import type { ServerInventoryItem } from "@/lib/api/servers";
import { toast } from "@/lib/toast";

import { useAgents, useRegisterAgent } from "./use-agents";
import { useServers } from "../servers/use-servers";

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
  baseUrl: z.url("Enter a valid agent URL.").max(512),
  sharedSecret: z.string().min(12, "Shared secret must be at least 12 characters.").max(512),
});

type RegisterAgentFormValues = z.input<typeof registerAgentSchema>;
type RegisterAgentPayload = z.output<typeof registerAgentSchema>;

function defaultRegisterAgentValues(
  server?: ServerInventoryItem
): RegisterAgentFormValues {
  return {
    serverId: server?.id ?? "",
    name: server ? `${server.name} Agent` : "",
    baseUrl: server ? `http://${server.ipAddress}:9187` : "http://127.0.0.1:9187",
    sharedSecret: "",
  };
}

function toRegisterAgentInput(
  payload: RegisterAgentPayload
): RegisterAgentInput {
  return {
    serverId: payload.serverId,
    name: payload.name?.trim() || undefined,
    baseUrl: payload.baseUrl.trim(),
    sharedSecret: payload.sharedSecret,
    pullEnabled: true,
  };
}

export function RegisterAgentDialog({
  initialServer,
  triggerLabel = "Configure agent",
}: {
  initialServer?: ServerInventoryItem;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
      const agent = await registerAgent.mutateAsync(toRegisterAgentInput(values));
      toast.success("Agent configured.", {
        description: agent.name,
      });
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof AgentApiError && error.status === 409) {
        const message = "The selected server already has an agent.";
        setFormError(message);
        toast.error("Unable to configure agent.", {
          description: message,
        });
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to configure the agent right now.";

      setFormError(message);
      toast.error("Unable to configure agent.", {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(defaultRegisterAgentValues(initialServer));
      setFormError(null);
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
      setValue("baseUrl", `http://${server.ipAddress}:9187`, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

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
          <DialogTitle>Configure agent</DialogTitle>
          <DialogDescription>
            Add the secured HTTP endpoint Kyvora will call to pull system data.
          </DialogDescription>
        </DialogHeader>

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

          <FormField
            error={errors.baseUrl?.message}
            htmlFor="register-agent-url"
            label="Agent base URL"
          >
            <Input
              id="register-agent-url"
              placeholder="http://10.0.0.15:9187"
              aria-invalid={Boolean(errors.baseUrl)}
              {...register("baseUrl")}
            />
          </FormField>

          <FormField
            error={errors.sharedSecret?.message}
            htmlFor="register-agent-secret"
            label="Shared secret"
          >
            <Input
              id="register-agent-secret"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.sharedSecret)}
              {...register("sharedSecret")}
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
              Configure agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  htmlFor: string;
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
