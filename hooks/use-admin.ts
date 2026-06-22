'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/types';
import {
  adminService,
  type AdminOverview,
  type AdminOverviewParams,
  type AuditLog,
  type AuditLogParams,
} from '@/services/admin.service';

export const adminKeys = {
  all: ['admin'] as const,
  overview: (params: AdminOverviewParams) =>
    [...adminKeys.all, 'overview', params] as const,
  auditLogs: (params: AuditLogParams) =>
    [...adminKeys.all, 'audit-logs', params] as const,
};

export function useAdminOverview(
  params: AdminOverviewParams = {},
  enabled = true
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
