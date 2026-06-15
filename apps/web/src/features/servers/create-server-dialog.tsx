"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptyServerFormValues,
  ServerForm,
  type ServerFormPayload,
  type ServerFormValues,
  serverFormSchema,
  toServerInput,
} from "@/features/servers/server-form";
import { useRegisterAgent } from "@/features/agents/use-agents";
import {
  AgentApiError,
  type AgentEnrollment,
} from "@/lib/api/agents";
import { AgentEnrollmentToken } from "@/features/agents/agent-enrollment-token";
import { useToastNotification } from "@/features/notifications/hooks/use-notifications";
import { useCreateServer } from "@/features/servers/use-servers";
import { ApiError } from "@/lib/api/servers";

export function getConflictField(error: ApiError): "hostname" | "ipAddress" | null {
  const duplicateDetail = error.details.find(
    (detail) =>
      detail.startsWith("hostname:") || detail.startsWith("ipAddress:")
  );

  if (duplicateDetail?.startsWith("hostname:")) {
    return "hostname";
  }

  if (duplicateDetail?.startsWith("ipAddress:")) {
    return "ipAddress";
  }

  if (error.message.toLowerCase().includes("hostname")) {
    return "hostname";
  }

  if (error.message.toLowerCase().includes("ipaddress")) {
    return "ipAddress";
  }

  return null;
}

export function CreateServerDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [enrollAgent, setEnrollAgent] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentNameTouched, setAgentNameTouched] = useState(false);
  const [enrollment, setEnrollment] = useState<AgentEnrollment | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);
  const createServer = useCreateServer();
  const registerAgent = useRegisterAgent();
  const toast = useToastNotification();
  const form = useForm<ServerFormValues, unknown, ServerFormPayload>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: emptyServerFormValues,
  });
  const serverName = useWatch({ control: form.control, name: "name" }) ?? "";
  const displayedAgentName = agentNameTouched
    ? agentName
    : defaultAgentName(serverName);

  async function onSubmit(values: ServerFormPayload) {
    setFormError(null);

    try {
      const server = await createServer.mutateAsync({
        ...toServerInput(values),
        status: "UNKNOWN",
      });
      toast.success(t("servers.serverCreated"), server.hostname);

      if (!enrollAgent) {
        form.reset(emptyServerFormValues);
        setOpen(false);
        return;
      }

      const trimmedAgentName = displayedAgentName.trim();
      if (trimmedAgentName && trimmedAgentName.length < 2) {
        const message =
          "Server was created, but the agent name must be at least 2 characters.";
        setFormError(message);
        toast.warning(t("servers.createdAgentSkipped"), message);
        return;
      }

      try {
        const enrolled = await registerAgent.mutateAsync({
          serverId: server.id,
          name: trimmedAgentName || undefined,
        });
        form.reset(emptyServerFormValues);
        setEnrollment(enrolled);
        toast.success(t("servers.agentEnrolled"), enrolled.agent.name);
      } catch (agentError) {
        const message =
          agentError instanceof AgentApiError && agentError.status === 409
            ? "Server was created, but this server already has an agent."
            : agentError instanceof Error
              ? `Server was created, but agent enrollment failed: ${agentError.message}`
              : "Server was created, but agent enrollment failed.";

        setFormError(message);
        toast.warning(t("servers.createdAgentFailed"), message);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const field = getConflictField(error);
        const message =
          field === "hostname"
            ? "A server with this hostname already exists."
            : field === "ipAddress"
              ? "A server with this IP address already exists."
              : "A server with matching unique inventory data already exists.";

        setFormError(message);
        toast.error(t("servers.unableToCreate"), message);

        if (field) {
          form.setError(field, { type: "server", message });
        }
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the server right now.";

      setFormError(message);
      toast.error(t("servers.unableToCreate"), message);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && enrollment && !agentConnected) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(emptyServerFormValues);
      setFormError(null);
      setEnrollAgent(false);
      setAgentName("");
      setAgentNameTouched(false);
      setEnrollment(null);
      setAgentConnected(false);
    }
  }

  const handleAgentConnectionChange = useCallback((connected: boolean) => {
    setAgentConnected(connected);
  }, []);

  function handleEnrollAgentChange(checked: boolean) {
    setEnrollAgent(checked);
  }

  function closeEnrollmentDialog() {
    setOpen(false);
    form.reset(emptyServerFormValues);
    setFormError(null);
    setEnrollAgent(false);
    setAgentName("");
    setAgentNameTouched(false);
    setEnrollment(null);
    setAgentConnected(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {t("servers.createServer")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl"
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
          <DialogTitle>
            {enrollment ? t("servers.agentToken") : t("servers.createServer")}
          </DialogTitle>
          <DialogDescription>
            {enrollment
              ? t("servers.tokenShownOnce")
              : t("servers.addManagedServer")}
          </DialogDescription>
        </DialogHeader>

        {enrollment ? (
          <AgentEnrollmentToken
            enrollment={enrollment}
            onClose={closeEnrollmentDialog}
            onConnectionChange={handleAgentConnectionChange}
          />
        ) : (
          <ServerForm
            childrenBeforeFooter={
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                <label
                  className="flex cursor-pointer items-start gap-3"
                  htmlFor="create-server-enroll-agent"
                >
                  <input
                    id="create-server-enroll-agent"
                    type="checkbox"
                    checked={enrollAgent}
                    onChange={(event) =>
                      handleEnrollAgentChange(event.currentTarget.checked)
                    }
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="grid gap-1 text-sm">
                    <span className="font-medium">
                      {t("servers.enrollAgent")}
                    </span>
                    <span className="text-muted-foreground">
                      {t("servers.enrollAgentDescription")}
                    </span>
                  </span>
                </label>

                {enrollAgent ? (
                  <div className="grid gap-2 pl-7">
                    <Label htmlFor="create-server-agent-name">
                      {t("servers.agentName")}
                    </Label>
                    <Input
                      id="create-server-agent-name"
                      value={displayedAgentName}
                      onChange={(event) => {
                        setAgentName(event.currentTarget.value);
                        setAgentNameTouched(true);
                      }}
                      placeholder={defaultAgentName(serverName)}
                    />
                  </div>
                ) : null}
              </div>
            }
            form={form}
            formError={formError}
            idPrefix="create-server"
            isPending={createServer.isPending || registerAgent.isPending}
            onCancel={() => handleOpenChange(false)}
            onSubmit={onSubmit}
            showStatusField={false}
            submitIcon={
              createServer.isPending || registerAgent.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )
            }
            submitLabel={
              enrollAgent ? t("servers.createAndEnroll") : t("servers.createServer")
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function defaultAgentName(serverName: string) {
  const trimmed = serverName.trim();
  return trimmed ? `${trimmed} Agent` : "Server Agent";
}
