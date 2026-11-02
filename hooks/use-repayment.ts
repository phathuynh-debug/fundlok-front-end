"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import { fundingKeys } from "@/hooks/use-funding";
import {
  repaymentService,
  type InvestmentDue,
  type ProjectedSchedule,
  type RepaymentRow,
  type TodaysPayments,
} from "@/services/repayment.service";

export const repaymentKeys = {
  all: ["repayment"] as const,
  today: () => [...repaymentKeys.all, "today"] as const,
  schedule: (trancheId: string) =>
    [...repaymentKeys.all, "schedule", trancheId] as const,
  projection: (trancheId: string) =>
    [...repaymentKeys.all, "projection", trancheId] as const,
  due: (trancheId: string) => [...repaymentKeys.all, "due", trancheId] as const,
};

export function useTodaysPayments(enabled = true) {
  return useQuery<TodaysPayments, ApiError>({
    queryKey: repaymentKeys.today(),
    queryFn: () => repaymentService.getToday(),
    enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
}

// One ticket's whole schedule, for its investor (or the business).
export function useRepaymentSchedule(trancheId: string, enabled = true) {
  return useQuery<RepaymentRow[], ApiError>({
    queryKey: repaymentKeys.schedule(trancheId),
    queryFn: () => repaymentService.getSchedule(trancheId),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useReportMissingDay(trancheId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    RepaymentRow,
    ApiError,
    { dayId: string; statement: string | null }
  >({
    mutationFn: ({ dayId, statement }) =>
      repaymentService.reportMissing(dayId, statement),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: repaymentKeys.schedule(trancheId),
      });
    },
  });
}

// What the business owes one investor now, as one transfer.
export function useInvestmentDue(trancheId: string, enabled = true) {
  return useQuery<InvestmentDue, ApiError>({
    queryKey: repaymentKeys.due(trancheId),
    queryFn: () => repaymentService.getDue(trancheId),
    enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
}

// The business uploads its transfer receipt, which marks the days paid.
export function usePayWithReceipt(trancheId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    RepaymentRow[],
    ApiError,
    { repaymentDayIds: string[]; file: File; idempotencyKey: string }
  >({
    mutationFn: ({ repaymentDayIds, file, idempotencyKey }) =>
      repaymentService.payWithReceipt(
        trancheId,
        repaymentDayIds,
        file,
        idempotencyKey,
      ),
    onSuccess: () => {
      // The schedule, what is due, today's list and the round's plan all move.
      void queryClient.invalidateQueries({ queryKey: repaymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: fundingKeys.all });
    },
  });
}

// A confirmed ticket's projected days, until its loan forms.
export function useRepaymentProjection(trancheId: string, enabled = true) {
  return useQuery<ProjectedSchedule, ApiError>({
    queryKey: repaymentKeys.projection(trancheId),
    queryFn: () => repaymentService.getProjection(trancheId),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
