"use client";

import { useQuery } from "@tanstack/react-query";

import {
  dashboardKeys,
  getDashboardSummary,
} from "@/lib/api/dashboard";

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: getDashboardSummary,
  });
}
