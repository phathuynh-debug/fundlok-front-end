"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fundingService,
  type FundingWindow,
  type InvestmentConfirmation,
  type InvestorAgreementStatus,
  type PaymentInstructions,
  type ReceiptResult,
  type ReserveRequest,
  type SmeRepaymentPlan,
  type SmeRound,
  type SignedInvestmentConfirmation,
  type SmeTicket,
  type Tranche,
} from "@/services/funding.service";
import type { ApiError } from "@/lib/types";

export const fundingKeys = {
  all: ["funding"] as const,
  window: (listingId: string) =>
    [...fundingKeys.all, "window", listingId] as const,
  myTranches: () => [...fundingKeys.all, "my-tranches"] as const,
  payment: (trancheId: string) =>
    [...fundingKeys.all, "payment", trancheId] as const,
  trancheConfirmation: (trancheId: string) =>
    [...fundingKeys.all, "confirmation", trancheId] as const,
  trancheConfirmationPdf: (trancheId: string) =>
    [...fundingKeys.all, "confirmation", trancheId, "pdf"] as const,
  myRounds: () => [...fundingKeys.all, "my-rounds"] as const,
  repaymentPlan: (windowId: string) =>
    [...fundingKeys.all, "repayment-plan", windowId] as const,
  investorAgreement: () => [...fundingKeys.all, "investor-agreement"] as const,
  investorAgreementPdf: () =>
    [...fundingKeys.all, "investor-agreement", "pdf"] as const,
  signedInvestorAgreement: (signedAt: string) =>
    [...fundingKeys.all, "investor-agreement", "signed", signedAt] as const,
  investmentConfirmation: (windowId: string, amountVnd: number) =>
    [
      ...fundingKeys.all,
      "investment-confirmation",
      windowId,
      amountVnd,
    ] as const,
};

// The project's funding window, by its listing. Null id: nothing to fetch (the
// project has no listing yet).
export function useFundingWindow(listingId: string | null) {
  return useQuery<FundingWindow, ApiError>({
    queryKey: fundingKeys.window(listingId ?? ""),
    queryFn: () => fundingService.getWindow(listingId as string),
    enabled: Boolean(listingId),
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useMyTranches(enabled = true) {
  return useQuery<Tranche[], ApiError>({
    queryKey: fundingKeys.myTranches(),
    queryFn: () => fundingService.listMyTranches(),
    enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
}

// Whether the investor must still sign and upload the Investor Service
// Agreement before committing, and Party B as signed or as the PDF fills it.
export function useInvestorAgreement(enabled = true) {
  return useQuery<InvestorAgreementStatus, ApiError>({
    queryKey: fundingKeys.investorAgreement(),
    queryFn: () => fundingService.getInvestorAgreement(),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}

// The agreement as a PDF filled in with the investor's details, to preview,
// download and sign. Generated on each request, so never cached.
export function useInvestorAgreementPdf(enabled = true) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: fundingKeys.investorAgreementPdf(),
    queryFn: () => fundingService.getInvestorAgreementPdf(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// The signed copy the investor uploaded, by when it was uploaded (a
// replacement is a different file).
export function useSignedInvestorAgreement(
  signedAt: string | null,
  enabled = true,
) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: fundingKeys.signedInvestorAgreement(signedAt ?? ""),
    queryFn: () => fundingService.getSignedInvestorAgreement(),
    enabled: enabled && Boolean(signedAt),
    staleTime: Infinity,
    retry: false,
  });
}

// Uploading the digitally signed agreement: the answer is the new status.
export function useUploadInvestorAgreement() {
  const queryClient = useQueryClient();
  return useMutation<
    InvestorAgreementStatus,
    ApiError,
    { file: File; version: string }
  >({
    mutationFn: ({ file, version }) =>
      fundingService.uploadSignedInvestorAgreement(file, version),
    onSuccess: (status) => {
      queryClient.setQueryData(fundingKeys.investorAgreement(), status);
    },
  });
}

// The Investment Confirmation (the agreement's Annex) for this amount on this
// window, filled in as the backend will sign it.
export function useInvestmentConfirmation(
  windowId: string | null,
  amountVnd: number,
) {
  return useQuery<InvestmentConfirmation, ApiError>({
    queryKey: fundingKeys.investmentConfirmation(windowId ?? "", amountVnd),
    queryFn: () =>
      fundingService.getInvestmentConfirmation(windowId as string, amountVnd),
    enabled: Boolean(windowId) && amountVnd > 0,
    staleTime: 60 * 1000,
    retry: false,
  });
}

// The Investment Confirmation kept for a ticket. It never changes once made.
export function useTrancheConfirmation(trancheId: string | null) {
  return useQuery<SignedInvestmentConfirmation, ApiError>({
    queryKey: fundingKeys.trancheConfirmation(trancheId ?? ""),
    queryFn: () => fundingService.getTrancheConfirmation(trancheId as string),
    enabled: Boolean(trancheId),
    staleTime: Infinity,
    retry: false,
  });
}

// Its filled-in PDF, to view and download.
export function useTrancheConfirmationPdf(
  trancheId: string | null,
  enabled = true,
) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: fundingKeys.trancheConfirmationPdf(trancheId ?? ""),
    queryFn: () =>
      fundingService.getTrancheConfirmationPdf(trancheId as string),
    enabled: enabled && Boolean(trancheId),
    staleTime: Infinity,
    retry: false,
  });
}

export function usePaymentInstructions(trancheId: string | null) {
  return useQuery<PaymentInstructions, ApiError>({
    queryKey: fundingKeys.payment(trancheId ?? ""),
    queryFn: () => fundingService.getPayment(trancheId as string),
    enabled: Boolean(trancheId),
    // The account and amount never change for a ticket.
    staleTime: Infinity,
    retry: false,
  });
}

export function useReserveTicket() {
  const queryClient = useQueryClient();
  return useMutation<
    Tranche,
    ApiError,
    { windowId: string; body: ReserveRequest; idempotencyKey: string }
  >({
    mutationFn: ({ windowId, body, idempotencyKey }) =>
      fundingService.reserve(windowId, body, idempotencyKey),
    onSuccess: (tranche) => {
      queryClient.setQueryData<Tranche[]>(fundingKeys.myTranches(), (old) => [
        tranche,
        ...(old ?? []).filter((t) => t.id !== tranche.id),
      ]);
      // The window's reserved and capacity figures moved.
      queryClient.invalidateQueries({
        queryKey: [...fundingKeys.all, "window"],
      });
      // Committing under the signed agreement means it can no longer be
      // replaced.
      void queryClient.invalidateQueries({
        queryKey: fundingKeys.investorAgreement(),
        exact: true,
      });
    },
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();
  return useMutation<
    ReceiptResult,
    ApiError,
    { trancheId: string; file: File; idempotencyKey: string }
  >({
    mutationFn: ({ trancheId, file, idempotencyKey }) =>
      fundingService.uploadReceipt(trancheId, file, idempotencyKey),
    onSuccess: () => {
      // The ticket now carries receipt_submitted_at (or went UNDER_REVIEW).
      void queryClient.invalidateQueries({
        queryKey: fundingKeys.myTranches(),
      });
    },
  });
}

// The business's rounds and tickets.
export function useMyRounds(enabled = true) {
  return useQuery<SmeRound[], ApiError>({
    queryKey: fundingKeys.myRounds(),
    queryFn: () => fundingService.listMyRounds(),
    enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
}

// Closing early moves the round's status and figures.
function useRoundMutation<TVars, TResult>(
  mutationFn: (vars: TVars) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TVars>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fundingKeys.myRounds() });
    },
  });
}

export function useCloseRoundEarly() {
  return useRoundMutation((windowId: string) =>
    fundingService.closeEarly(windowId),
  );
}

export function useReportMissingTransfer() {
  return useRoundMutation<
    { trancheId: string; statement: string | null },
    SmeTicket
  >(({ trancheId, statement }) =>
    fundingService.reportMissingTransfer(trancheId, statement),
  );
}

// The business's daily repayments: projected until the loan forms, then real.
export function useRepaymentPlan(windowId: string, enabled = true) {
  return useQuery<SmeRepaymentPlan, ApiError>({
    queryKey: fundingKeys.repaymentPlan(windowId),
    queryFn: () => fundingService.getRepaymentPlan(windowId),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}
