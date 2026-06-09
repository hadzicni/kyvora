"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, ServerCrash } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden bg-[#05070a] px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

      <Card className="relative w-full max-w-md border-white/10 bg-zinc-950/85 text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center gap-3">
            <Image
              src="/icon.svg"
              alt=""
              width={32}
              height={32}
              priority
              aria-hidden="true"
              className="size-8"
            />
            <span className="text-xl font-semibold tracking-tight">Kyvora</span>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-200">
            <ServerCrash className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="pt-2 text-2xl text-white">
            Backend unavailable
          </CardTitle>
          <CardDescription className="text-balance text-zinc-400">
            The Kyvora API is not reachable. Make sure the backend is running
            and try again.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Expected API
            </div>
            <div className="mt-1 break-all font-mono text-xs text-zinc-300">
              {health?.expectedApi ?? "configured backend"}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Local development
            </div>
            <div className="mt-1 font-mono text-xs text-zinc-300">
              npm run dev:api
            </div>
          </div>

          <p className="text-center text-xs text-zinc-500">
            Last checked {formatLastChecked(lastCheckedAt)}
          </p>
        </CardContent>

        <CardFooter className="border-white/10 bg-white/[0.03]">
          <Button
            className="h-10 w-full gap-2 bg-white text-zinc-950 hover:bg-zinc-200"
            disabled={isRetrying}
            onClick={async () => {
              setIsRetrying(true);
              try {
                await healthQuery.refetch();
              } finally {
                setIsRetrying(false);
              }
            }}
            type="button"
          >
            {isRetrying ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Retry
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
