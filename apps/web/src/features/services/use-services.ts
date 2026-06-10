"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createService,
  deleteService,
  getService,
  listServices,
  serviceKeys,
  updateService,
  ServiceApiError,
  type CreateServiceInput,
  type ListServicesParams,
  type UpdateServiceInput,
} from "@/lib/api/services";

export function useServices(params: ListServicesParams = {}) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => listServices(params),
    placeholderData: keepPreviousData,
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => getService(id),
    enabled: id.length > 0,
    retry: (failureCount, error) =>
      error instanceof ServiceApiError && error.status === 404
        ? false
        : failureCount < 3,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServiceInput) => createService(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceInput }) =>
      updateService({ id, input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}
