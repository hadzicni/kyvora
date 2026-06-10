"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getNetworkMap,
  networkMapKeys,
  NetworkMapApiError,
} from "@/lib/api/network-map";

export function useNetworkMap() {
  return useQuery({
    queryKey: networkMapKeys.detail(),
    queryFn: getNetworkMap,
    retry: (failureCount, error) =>
      error instanceof NetworkMapApiError && error.status === 403
        ? false
        : failureCount < 2,
  });
}
