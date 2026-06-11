"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatCategory } from "./service-form";

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
  const [selectedService, setSelectedService] =
    useState<ManagedServiceItem | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Server</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={service.id}
              onClick={() => setSelectedService(service)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedService(service);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TableCell className="min-w-56">
                <div className="font-medium">{service.name}</div>
                <div className="max-w-56 truncate text-xs text-muted-foreground">
                  {service.description || "No description"}
                </div>
              </TableCell>
              <TableCell>{formatCategory(service.category)}</TableCell>
              <TableCell>
                <ServiceUrl service={service} />
              </TableCell>
              <TableCell>
                <div className="grid gap-1 text-xs">
                  <span className="font-mono">
                    {service.hostname || service.ipAddress || "Unassigned"}
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
                    <span className="text-xs text-muted-foreground">None</span>
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
                  <span className="text-muted-foreground">Unassigned</span>
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

      <Dialog
        open={Boolean(selectedService)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedService(null);
          }
        }}
      >
        <DialogContent>
          {selectedService ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedService.name}</DialogTitle>
                <DialogDescription>
                  {selectedService.description || "No description"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <DetailRow label="Category">
                  {formatCategory(selectedService.category)}
                </DetailRow>
                <DetailRow label="Protocol">
                  <Badge variant="secondary">{selectedService.protocol}</Badge>
                </DetailRow>
                <DetailRow label="URL">
                  <ServiceUrl service={selectedService} />
                </DetailRow>
                <DetailRow label="Host">
                  {[
                    selectedService.hostname,
                    selectedService.ipAddress,
                    selectedService.port ? String(selectedService.port) : null,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "Unassigned"}
                </DetailRow>
                <DetailRow label="Linked server">
                  {selectedService.linkedServer?.name || "Unassigned"}
                </DetailRow>
                <DetailRow label="Notes">
                  <span className="whitespace-pre-wrap">
                    {selectedService.notes || "None"}
                  </span>
                </DetailRow>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ServiceUrl({ service }: { service: ManagedServiceItem }) {
  if (!service.url) {
    return <span className="text-muted-foreground">None</span>;
  }

  return (
    <div className="flex max-w-64 items-center gap-1">
      <a
        className="truncate text-sm text-primary underline-offset-4 hover:underline"
        href={service.url}
        rel="noreferrer"
        target="_blank"
      >
        {service.url}
      </a>
      <Button
        aria-label={`Open ${service.name}`}
        asChild
        size="icon"
        variant="ghost"
      >
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

function DetailRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-1 rounded-md border p-3 sm:grid-cols-[8rem_1fr]">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
