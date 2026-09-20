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
  type AdminDecisionPayload,
  type AdminKybVerification,
  type AdminLoanApplication,
  type AdminOverview,
  type AdminOverviewParams,
  type AdminProjectDetail,
  type AdminUserDetail,
  type AdminUserStatusPayload,
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
  projectDetail: (projectId: string) =>
    [...adminKeys.all, "project", projectId] as const,
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

// --- Project preview: the two-approval gate -------------------------------- //

// One company, its funding requests, and the owner's latest KYB. Only fetched
// while the preview is open, so the list view stays one request.
export function useAdminProjectDetail(projectId: string | null) {
  return useQuery<AdminProjectDetail, ApiError>({
    queryKey: adminKeys.projectDetail(projectId ?? ""),
    queryFn: () => adminService.getProjectDetail(projectId as string),
    enabled: projectId !== null,
    staleTime: 0,
    retry: false,
  });
}

interface DecisionInput {
  id: string;
  body: AdminDecisionPayload;
}

// Settles a parked KYB attempt. Invalidates rather than seeding the cache: the
// verdict changes whether the project counts as verified, and the preview also
// shows applications whose gate state is read against it.
export function useResolveKybVerification(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<AdminKybVerification, ApiError, DecisionInput>({
    mutationFn: ({ id, body }) => adminService.resolveKybVerification(id, body),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: adminKeys.projectDetail(projectId),
        });
      }
    },
  });
}

// The operator half. Same invalidation reasoning, plus the overview list shows
// project status that a decision can move.
export function useDecideApplication(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<AdminLoanApplication, ApiError, DecisionInput>({
    mutationFn: ({ id, body }) => adminService.decideApplication(id, body),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: adminKeys.projectDetail(projectId),
        });
      }
    },
  });
}

// Changes an account's status. Invalidates the overview rather than seeding it:
// the status column is rendered in the table the panel was opened from, and a
// suspension is consequential enough to be worth re-reading from the server.
export function useSetUserStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminUserDetail,
    ApiError,
    { id: string; body: AdminUserStatusPayload }
  >({
    mutationFn: ({ id, body }) => adminService.setUserStatus(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
