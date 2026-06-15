"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { searchKeys, searchKyvora } from "@/lib/api/search";

export function useGlobalSearch(query: string, enabled = true) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: searchKeys.query({ q: normalizedQuery, limit: 12 }),
    queryFn: () => searchKyvora({ q: normalizedQuery, limit: 12 }),
    enabled: enabled && normalizedQuery.length >= 2,
    placeholderData: keepPreviousData,
  });
}
