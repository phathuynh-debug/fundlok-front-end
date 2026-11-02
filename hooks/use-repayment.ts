"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  repaymentService,
  type RepaymentRow,
  type TodaysPayments,
} from "@/services/repayment.service";

export const repaymentKeys = {
  all: ["repayment"] as const,
  today: () => [...repaymentKeys.all, "today"] as const,
  schedule: (trancheId: string) =>
    [...repaymentKeys.all, "schedule", trancheId] as const,
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

export function useMarkDaysPaid() {
  const queryClient = useQueryClient();
  return useMutation<
    RepaymentRow[],
    ApiError,
    { repaymentDayIds: string[]; idempotencyKey: string }
  >({
    mutationFn: ({ repaymentDayIds, idempotencyKey }) =>
      repaymentService.markPaid(repaymentDayIds, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repaymentKeys.all });
    },
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
