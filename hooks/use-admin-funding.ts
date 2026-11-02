"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import { adminKeys } from "@/hooks/use-admin";
import { fundingKeys } from "@/hooks/use-funding";
import type { AdminTable } from "@/services/admin.service";
import {
  adminFundingService,
  type AdminActivityParams,
  type AdminFundingActivity,
  type AdminFundingRound,
  type AdminInvestorTransfer,
  type AdminReceiptFieldsPayload,
  type AdminReceiptUrl,
  type AdminRoundFilter,
  type AdminTransferDecisionPayload,
  type AdminTransferListParams,
} from "@/services/admin-funding.service";

export const adminFundingKeys = {
  all: [...adminKeys.all, "funding"] as const,
  rounds: (status: AdminRoundFilter) =>
    [...adminFundingKeys.all, "rounds", status] as const,
  transfers: (params: AdminTransferListParams) =>
    [...adminFundingKeys.all, "transfers", params] as const,
  transfer: (trancheId: string) =>
    [...adminFundingKeys.all, "transfer", trancheId] as const,
  receiptUrl: (transferId: string) =>
    [...adminFundingKeys.all, "receipt-url", transferId] as const,
  activity: (params: AdminActivityParams) =>
    [...adminFundingKeys.all, "activity", params] as const,
};

export function useAdminFundingRounds(status: AdminRoundFilter) {
  return useQuery<AdminFundingRound[], ApiError>({
    queryKey: adminFundingKeys.rounds(status),
    queryFn: () => adminFundingService.listRounds(status),
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useAdminInvestorTransfers(params: AdminTransferListParams) {
  return useQuery<AdminTable<AdminInvestorTransfer>, ApiError>({
    queryKey: adminFundingKeys.transfers(params),
    queryFn: () => adminFundingService.listTransfers(params),
    staleTime: 30 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

// The audit trail. Under adminFundingKeys.all, so every decision refreshes it.
export function useAdminFundingActivity(params: AdminActivityParams) {
  return useQuery<AdminTable<AdminFundingActivity>, ApiError>({
    queryKey: adminFundingKeys.activity(params),
    queryFn: () => adminFundingService.listActivity(params),
    staleTime: 30 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

// The review panel reads its own copy, so it shows the ticket as it is now.
export function useAdminInvestorTransfer(trancheId: string | null) {
  return useQuery<AdminInvestorTransfer, ApiError>({
    queryKey: adminFundingKeys.transfer(trancheId ?? ""),
    queryFn: () => adminFundingService.getTransfer(trancheId as string),
    enabled: Boolean(trancheId),
    staleTime: 0,
    retry: false,
  });
}

// Fetched only when staff open the receipt: the link expires in 10 minutes
// and every fetch is audited.
export function useAdminReceiptUrl(transferId: string | null) {
  return useQuery<AdminReceiptUrl, ApiError>({
    queryKey: adminFundingKeys.receiptUrl(transferId ?? ""),
    queryFn: () => adminFundingService.getReceiptUrl(transferId as string),
    enabled: Boolean(transferId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

// Both decisions move the ticket, the round's totals and its counts.
function useInvalidateFunding() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminFundingKeys.all });
    void queryClient.invalidateQueries({ queryKey: fundingKeys.all });
  };
}

export function useEnterTransferFields() {
  const invalidate = useInvalidateFunding();
  return useMutation<
    AdminInvestorTransfer,
    ApiError,
    { transferId: string; body: AdminReceiptFieldsPayload }
  >({
    mutationFn: ({ transferId, body }) =>
      adminFundingService.enterFields(transferId, body),
    onSuccess: invalidate,
  });
}

export function useDecideTransfer() {
  const invalidate = useInvalidateFunding();
  return useMutation<
    AdminInvestorTransfer,
    ApiError,
    { reviewId: string; body: AdminTransferDecisionPayload }
  >({
    mutationFn: ({ reviewId, body }) =>
      adminFundingService.decide(reviewId, body),
    onSuccess: invalidate,
  });
}
