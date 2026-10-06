"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import { gverifyKeys } from "@/hooks/use-gverify";
import {
  adminService,
  type AdminDecisionPayload,
  type AdminDocumentUrl,
  type AdminInvitePayload,
  type AdminKybCertificateUrl,
  type AdminKybResolvePayload,
  type AdminKybReview,
  type AdminKybVerification,
  type AdminKycImageName,
  type AdminKycImageUrl,
  type AdminKycStatus,
  type AdminKycResolvePayload,
  type AdminKycVerification,
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
  type VerificationMode,
  type VerificationModeState,
} from "@/services/admin.service";

export const adminKeys = {
  all: ["admin"] as const,
  // Every variant of the overview (users or projects, any page or search).
  overviewAll: () => [...adminKeys.all, "overview"] as const,
  overview: (params: AdminOverviewParams) =>
    [...adminKeys.overviewAll(), params] as const,
  auditLogs: (params: AuditLogParams) =>
    [...adminKeys.all, "audit-logs", params] as const,
  maintenance: () => [...adminKeys.all, "maintenance"] as const,
  documentUrl: (documentId: string) =>
    [...adminKeys.all, "document-url", documentId] as const,
  projectDetail: (projectId: string) =>
    [...adminKeys.all, "project", projectId] as const,
  kycAll: () => [...adminKeys.all, "kyc"] as const,
  kycQueue: (status: AdminKycStatus) =>
    [...adminKeys.kycAll(), "list", status] as const,
  kycVerification: (id: string) =>
    [...adminKeys.kycAll(), "detail", id] as const,
  kybAll: () => [...adminKeys.all, "kyb"] as const,
  kybQueue: (status: AdminKycStatus) =>
    [...adminKeys.kybAll(), "list", status] as const,
  kybVerification: (id: string) =>
    [...adminKeys.kybAll(), "detail", id] as const,
  kybCertificate: (id: string) =>
    [...adminKeys.kybAll(), "certificate", id] as const,
  verificationMode: () => [...adminKeys.all, "verification-mode"] as const,
  kycImage: (id: string, name: AdminKycImageName) =>
    [...adminKeys.kycAll(), "image", id, name] as const,
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

interface KybResolveInput {
  id: string;
  body: AdminKybResolvePayload;
}

interface KycResolveInput {
  id: string;
  body: AdminKycResolvePayload;
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
// project status that a decision can move: the approval that arrives second is
// the one that puts a business live, and the table must not go on saying Draft.
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
      void queryClient.invalidateQueries({ queryKey: adminKeys.overviewAll() });
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

// Creates an ADMIN account and emails the invitee a set-password link
// (SYSTEM_ADMIN only server-side). Invalidates the overview so the new account
// appears in the users table and the role counts move.
export function useInviteAdmin() {
  const queryClient = useQueryClient();
  return useMutation<AdminUserDetail, ApiError, AdminInvitePayload>({
    mutationFn: (body) => adminService.inviteAdmin(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.overviewAll() });
    },
  });
}

// A read URL for one document, fetched only while its dialog is open.
// staleTime 0 because the URL expires in 10 minutes — a cached one is worse
// than a refetch.
export function useAdminDocumentUrl(documentId: string | null) {
  return useQuery<AdminDocumentUrl, ApiError>({
    queryKey: adminKeys.documentUrl(documentId ?? ""),
    queryFn: () => adminService.getDocumentUrl(documentId as string),
    enabled: documentId !== null,
    staleTime: 0,
    retry: false,
  });
}

// --- KYC manual review ------------------------------------------------------ //

// KYC attempts in one status. Defaults to the review queue; staleTime is short
// because the queue is worked by several people.
export function useAdminKycVerifications(
  status: AdminKycStatus = "MANUAL_REVIEW",
) {
  return useQuery<AdminKycVerification[], ApiError>({
    queryKey: adminKeys.kycQueue(status),
    queryFn: () => adminService.getKycVerifications(status),
    staleTime: 15 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

// One attempt, only while its review panel is open. staleTime 0: the conflict
// list is recomputed server-side and may have changed since the queue loaded.
export function useAdminKycVerification(id: string | null) {
  return useQuery<AdminKycVerification, ApiError>({
    queryKey: adminKeys.kycVerification(id ?? ""),
    queryFn: () => adminService.getKycVerification(id as string),
    enabled: id !== null,
    staleTime: 0,
    retry: false,
  });
}

// A read URL for one submitted image. staleTime 0 for the same reason as
// useAdminDocumentUrl: the URL expires in 10 minutes.
export function useAdminKycImageUrl(id: string, name: AdminKycImageName) {
  return useQuery<AdminKycImageUrl, ApiError>({
    queryKey: adminKeys.kycImage(id, name),
    queryFn: () => adminService.getKycImageUrl(id, name),
    staleTime: 0,
    retry: false,
  });
}

// Settles a parked attempt. Invalidates every KYC query: the attempt leaves the
// queue, joins another status list, and may become (or stop being) the
// conflict shown on other attempts.
export function useResolveKycVerification() {
  const queryClient = useQueryClient();
  return useMutation<AdminKycVerification, ApiError, KycResolveInput>({
    mutationFn: ({ id, body }) => adminService.resolveKycVerification(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.kycAll() });
    },
  });
}

// ---------- KYB review queue ----------

export function useAdminKybVerifications(status: AdminKycStatus) {
  return useQuery<AdminKybReview[], ApiError>({
    queryKey: adminKeys.kybQueue(status),
    queryFn: () => adminService.getKybVerifications(status),
    staleTime: 30 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useAdminKybVerification(id: string | null) {
  return useQuery<AdminKybReview, ApiError>({
    queryKey: adminKeys.kybVerification(id ?? ""),
    queryFn: () => adminService.getKybVerification(id as string),
    enabled: id !== null,
    staleTime: 0,
    retry: false,
  });
}

// staleTime 0 because the URL expires in 10 minutes.
export function useAdminKybCertificateUrl(id: string | null) {
  return useQuery<AdminKybCertificateUrl, ApiError>({
    queryKey: adminKeys.kybCertificate(id ?? ""),
    queryFn: () => adminService.getKybCertificateUrl(id as string),
    enabled: id !== null,
    staleTime: 0,
    retry: false,
  });
}

// Settles a parked KYB attempt from the review queue. Invalidates every KYB
// query plus the project previews and overview, where the same verdict is the
// "registration verified" half of an application's gate.
export function useResolveKybReview() {
  const queryClient = useQueryClient();
  return useMutation<AdminKybVerification, ApiError, KybResolveInput>({
    mutationFn: ({ id, body }) => adminService.resolveKybVerification(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

// ---------- Verification mode (SYSTEM_ADMIN) ----------

export function useVerificationModeAdmin(enabled = true) {
  return useQuery<VerificationModeState, ApiError>({
    queryKey: adminKeys.verificationMode(),
    queryFn: () => adminService.getVerificationModeAdmin(),
    staleTime: 0,
    retry: false,
    enabled,
  });
}

// Seeds the admin copy and invalidates the user-facing one, so this browser's
// KYC/KYB screens and the review-page banner pick up the change at once.
export function useSetVerificationMode() {
  const queryClient = useQueryClient();
  return useMutation<VerificationModeState, ApiError, VerificationMode>({
    mutationFn: (mode) => adminService.setVerificationMode(mode),
    onSuccess: (state) => {
      queryClient.setQueryData(adminKeys.verificationMode(), state);
      void queryClient.invalidateQueries({
        queryKey: gverifyKeys.verificationMode(),
      });
    },
  });
}
