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
  type AdminFeeInvoice,
  type AdminFundingActivity,
  type AdminFundingRound,
  type AdminInvestorTransfer,
  type AdminOverdueRepayments,
  type AdminReceiptDecisionPayload,
  type AdminReceiptUrl,
  type AdminRepaymentListParams,
  type AdminRepaymentPreview,
  type AdminRepaymentReceipt,
  type AdminRoundFilter,
  type AdminTransferListParams,
  type FeeInvoiceFilter,
  type MarkFeePaidPayload,
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
  repaymentPreview: (trancheId: string) =>
    [...adminFundingKeys.all, "repayment-preview", trancheId] as const,
  repayments: (params: AdminRepaymentListParams) =>
    [...adminFundingKeys.all, "repayments", params] as const,
  // Under "repayments" so the Repayments tab's refresh reloads it too.
  overdueRepayments: () =>
    [...adminFundingKeys.all, "repayments", "overdue"] as const,
  repayment: (receiptId: string) =>
    [...adminFundingKeys.all, "repayment", receiptId] as const,
  repaymentReceiptUrl: (receiptId: string) =>
    [...adminFundingKeys.all, "repayment-receipt-url", receiptId] as const,
  feeInvoices: (status: FeeInvoiceFilter) =>
    [...adminFundingKeys.all, "fee-invoices", status] as const,
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

// The repayment approving starts. Under adminFundingKeys.all, so a decision
// turns the preview into the days the investment got.
export function useAdminRepaymentPreview(trancheId: string, enabled = true) {
  return useQuery<AdminRepaymentPreview, ApiError>({
    queryKey: adminFundingKeys.repaymentPreview(trancheId),
    queryFn: () => adminFundingService.getRepaymentPreview(trancheId),
    enabled,
    staleTime: 30 * 1000,
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

// A decision moves the ticket, the round's totals and its counts, and the
// investor's own view of their ticket.
export function useDecideReceipt() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminInvestorTransfer,
    ApiError,
    { transferId: string; body: AdminReceiptDecisionPayload }
  >({
    mutationFn: ({ transferId, body }) =>
      adminFundingService.decide(transferId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminFundingKeys.all });
      void queryClient.invalidateQueries({ queryKey: fundingKeys.all });
    },
  });
}

export function useAdminRepaymentReceipts(params: AdminRepaymentListParams) {
  return useQuery<AdminTable<AdminRepaymentReceipt>, ApiError>({
    queryKey: adminFundingKeys.repayments(params),
    queryFn: () => adminFundingService.listRepayments(params),
    staleTime: 30 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

// Tickets a business is late repaying. Read on the Transactions page itself so
// the Repayments tab can show its red count from any tab.
export function useAdminOverdueRepayments(enabled = true) {
  return useQuery<AdminOverdueRepayments, ApiError>({
    queryKey: adminFundingKeys.overdueRepayments(),
    queryFn: () => adminFundingService.listOverdueRepayments(),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}

// The review panel reads its own copy, so it shows the receipt as it is now.
export function useAdminRepaymentReceipt(receiptId: string | null) {
  return useQuery<AdminRepaymentReceipt, ApiError>({
    queryKey: adminFundingKeys.repayment(receiptId ?? ""),
    queryFn: () => adminFundingService.getRepayment(receiptId as string),
    enabled: Boolean(receiptId),
    staleTime: 0,
    retry: false,
  });
}

// Fetched only when staff open the receipt: the link expires in 10 minutes
// and every fetch is audited.
export function useAdminRepaymentReceiptUrl(receiptId: string | null) {
  return useQuery<AdminReceiptUrl, ApiError>({
    queryKey: adminFundingKeys.repaymentReceiptUrl(receiptId ?? ""),
    queryFn: () =>
      adminFundingService.getRepaymentReceiptUrl(receiptId as string),
    enabled: Boolean(receiptId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

// Moves the round and may form its loan: every admin funding view refreshes.
/** SME service-fee invoices, each with its investment package. */
export function useAdminFeeInvoices(status: FeeInvoiceFilter, enabled = true) {
  return useQuery<AdminFeeInvoice[], ApiError>({
    queryKey: adminFundingKeys.feeInvoices(status),
    queryFn: () => adminFundingService.listFeeInvoices(status),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
  });
}

/** Marks a fee paid. Refreshes the fee lists and the rounds (their fee badge). */
export function useMarkFeeInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminFeeInvoice,
    ApiError,
    { invoiceId: string; payload: MarkFeePaidPayload }
  >({
    mutationFn: ({ invoiceId, payload }) =>
      adminFundingService.markFeeInvoicePaid(invoiceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminFundingKeys.all });
    },
  });
}

export function useAdvanceRound() {
  const queryClient = useQueryClient();
  return useMutation<AdminFundingRound, ApiError, string>({
    mutationFn: (windowId) => adminFundingService.advanceRound(windowId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminFundingKeys.all });
    },
  });
}
