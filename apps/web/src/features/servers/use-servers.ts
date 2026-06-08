"use client";

import { useQuery } from "@tanstack/react-query";

import { listServers, serverKeys, type ListServersParams } from "@/lib/api/servers";

export function useServers(params: ListServersParams = {}) {
  return useQuery({
    queryKey: serverKeys.list(params),
    queryFn: () => listServers(params),
  });
}
