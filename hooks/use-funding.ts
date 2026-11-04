"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fundingService,
  type FundingWindow,
  type PaymentInstructions,
  type ReceiptResult,
  type ReserveRequest,
  type SmeRepaymentPlan,
  type SmeRound,
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
  myRounds: () => [...fundingKeys.all, "my-rounds"] as const,
  repaymentPlan: (windowId: string) =>
    [...fundingKeys.all, "repayment-plan", windowId] as const,
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
