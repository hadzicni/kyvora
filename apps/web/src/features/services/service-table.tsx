"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServerInventoryItem } from "@/lib/api/servers";
import type { ManagedServiceItem } from "@/lib/api/services";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { EditServiceDialog } from "./edit-service-dialog";

export function ServiceTable({
  canDelete = true,
  canEdit = true,
  services,
  servers,
}: {
  canDelete?: boolean;
  canEdit?: boolean;
  services: ManagedServiceItem[];
  servers: ServerInventoryItem[];
}) {
  const t = useTranslations();
  const router = useRouter();

  function openService(service: ManagedServiceItem) {
    router.push(`/services/${service.id}`);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("forms.name")}</TableHead>
          <TableHead>{t("services.category")}</TableHead>
          <TableHead>{t("services.url")}</TableHead>
          <TableHead>{t("services.host")}</TableHead>
          <TableHead>{t("forms.tags")}</TableHead>
          <TableHead>{t("agents.server")}</TableHead>
          <TableHead className="w-28 text-right">
            {t("servers.actionsHeader")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            key={service.id}
            onClick={() => openService(service)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openService(service);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <TableCell className="min-w-56">
              <div className="font-medium">{service.name}</div>
              <div className="max-w-56 truncate text-xs text-muted-foreground">
                {service.description || t("servers.noDescription")}
              </div>
            </TableCell>
            <TableCell>{t(`serviceCategories.${service.category}`)}</TableCell>
            <TableCell>
              <ServiceUrl service={service} />
            </TableCell>
            <TableCell>
              <div className="grid gap-1 text-xs">
                <span className="font-mono">
                  {service.hostname || service.ipAddress || t("common.unassigned")}
                </span>
                <span className="text-muted-foreground">
                  {service.protocol}
                  {service.port ? `:${service.port}` : ""}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex max-w-56 flex-wrap gap-1">
                {service.tags.length > 0 ? (
                  service.tags.map((tag) => (
                    <span
                      className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("common.none")}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {service.linkedServer ? (
                <div className="grid gap-1">
                  <span>{service.linkedServer.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {service.linkedServer.hostname}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {t("common.unassigned")}
                </span>
              )}
            </TableCell>
            <TableCell
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <div className="flex justify-end gap-1">
                {canEdit ? <EditServiceDialog service={service} servers={servers} /> : null}
                {canDelete ? <DeleteServiceDialog service={service} /> : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ServiceUrl({ service }: { service: ManagedServiceItem }) {
  const t = useTranslations();

  if (!service.url) {
    return <span className="text-muted-foreground">{t("common.none")}</span>;
  }

  return (
    <div
      className="flex max-w-64 items-center gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <a
        className="truncate text-sm text-primary underline-offset-4 hover:underline"
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
