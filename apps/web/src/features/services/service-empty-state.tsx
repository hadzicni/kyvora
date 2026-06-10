import { Cable } from "lucide-react";

export function ServiceEmptyState() {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed py-12 text-center">
      <div className="grid max-w-md gap-3">
        <Cable className="mx-auto size-8 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">No services found</h3>
          <p className="text-sm text-muted-foreground">
            Register Grafana, Jellyfin, Pi-hole, Proxmox, or another homelab
            service to start tracking it.
          </p>
        </div>
      </div>
    </div>
  );
}
