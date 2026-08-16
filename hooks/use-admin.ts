"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  adminService,
  type AdminOverview,
  type AdminOverviewParams,
  type AuditLog,
  type AuditLogParams,
  type MaintenanceState,
  type MaintenanceUpdate,
} from "@/services/admin.service";

export const adminKeys = {
  all: ["admin"] as const,
  overview: (params: AdminOverviewParams) =>
    [...adminKeys.all, "overview", params] as const,
  auditLogs: (params: AuditLogParams) =>
    [...adminKeys.all, "audit-logs", params] as const,
  maintenance: () => [...adminKeys.all, "maintenance"] as const,
};

export function useAdminOverview(
  params: AdminOverviewParams = {},
  enabled = true,
) {
  return useQuery<AdminOverview, ApiError>({
    queryKey: adminKeys.overview(params),
    queryFn: () => adminService.getOverview(params),
    staleTime: 60 * 1000,
    retry: false,
    enabled,
    // Keep the previous table visible while paging/filtering to avoid flicker.
    placeholderData: keepPreviousData,
  });
}

export function useAuditLogs(params: AuditLogParams = {}, enabled = true) {
  return useQuery<AuditLog[], ApiError>({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminService.getAuditLogs(params),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
    placeholderData: keepPreviousData,
  });
}

// System-admin only — current maintenance state.
export function useMaintenance(enabled = true) {
  return useQuery<MaintenanceState, ApiError>({
    queryKey: adminKeys.maintenance(),
    queryFn: () => adminService.getMaintenance(),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
  });
}

export function useSetMaintenance() {
  const queryClient = useQueryClient();
  return useMutation<MaintenanceState, ApiError, MaintenanceUpdate>({
    mutationFn: (body) => adminService.setMaintenance(body),
    onSuccess: (state) => {
      queryClient.setQueryData(adminKeys.maintenance(), state);
    },
  });
}
