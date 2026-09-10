"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, ServerCrash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AuthShell } from "@/components/app/auth-shell";
import {
  type BackendHealth,
  getBackendHealth,
} from "@/lib/api/backend-health";

type BackendHealthState = "unknown" | "up" | "down";

function formatLastChecked(date: Date | null) {
  if (!date) {
    return "Not checked yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function BackendHealthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<BackendHealthState>("unknown");
  const [isRetrying, setIsRetrying] = useState(false);
  const healthQuery = useQuery({
    queryKey: ["backend-health"],
    queryFn: getBackendHealth,
    refetchInterval: (query) => (query.state.data?.ok === false ? 5_000 : 60_000),
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 0,
  });

  const health: BackendHealth | null = healthQuery.data ?? null;
  const status: BackendHealthState =
    health?.ok === false ? "down" : health?.ok ? "up" : "unknown";
  const lastCheckedAt =
    healthQuery.dataUpdatedAt > 0 ? new Date(healthQuery.dataUpdatedAt) : null;

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = status;

    if (previousStatus === "down" && status === "up") {
      void queryClient.invalidateQueries();
    }
  }, [queryClient, status]);

  if (status !== "down") {
    return children;
  }

  return (
    <AuthShell
      subtitle="The Kyvora API is not reachable. Make sure the backend is running and try again."
      title="Backend unavailable"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-600/10 px-3.5 py-3 text-red-200">
          <ServerCrash aria-hidden="true" className="size-5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-red-200/70">
              Expected API
            </div>
            <div className="mt-0.5 break-all font-mono text-xs">
              {health?.expectedApi ?? "configured backend"}
            </div>
          </div>
        </div>

        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRetrying}
          onClick={async () => {
            setIsRetrying(true)
            try {
              await healthQuery.refetch()
            } finally {
              setIsRetrying(false)
            }
          }}
          type="button"
        >
          {isRetrying ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="size-4" />
          )}
          Retry
        </button>

        <p className="text-center text-xs text-white/30">
          Last checked {formatLastChecked(lastCheckedAt)}
        </p>
      </div>
    </AuthShell>
  );
}
