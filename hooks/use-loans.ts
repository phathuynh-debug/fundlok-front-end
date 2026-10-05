"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  loansService,
  type LoanApplicationFiguresPayload,
  type LoanApplicationSubmitResponse,
  publicRateService,
  type RateEstimate,
  type RateEstimatePayload,
} from "@/services/loans.service";
import { projectKeys } from "@/hooks/use-projects";

export function useSubmitLoanApplication() {
  const queryClient = useQueryClient();

  return useMutation<LoanApplicationSubmitResponse, ApiError, string>({
    mutationFn: (applicationId) =>
      loansService.submitApplication(applicationId),
    onSuccess: () => {
      // Submitting moves the application out of DRAFT — refetch so the
      // dashboard swaps the upload wizard for the submitted state.
      queryClient.invalidateQueries({ queryKey: projectKeys.mine() });
    },
  });
}

export function useSaveLoanFigures() {
  const queryClient = useQueryClient();

  return useMutation<
    LoanApplicationFiguresPayload,
    ApiError,
    { applicationId: string; payload: LoanApplicationFiguresPayload }
  >({
    mutationFn: ({ applicationId, payload }) =>
      loansService.saveFigures(applicationId, payload),
    onSuccess: () => {
      // The figures are part of the application record the dashboard reads.
      queryClient.invalidateQueries({ queryKey: projectKeys.mine() });
    },
  });
}

/**
 * The public rate calculator (/rate).
 *
 * A mutation rather than a query: nothing exists to read until the visitor
 * presses Calculate, and the result is a function of what they typed rather
 * than of server state. That also keeps the engine off the keystroke path —
 * no debounced requests firing as someone types their revenue.
 *
 * `retry: false` for the same reason as the wizard's band: every error this
 * endpoint returns is a 422 describing something the visitor must change.
 */
export function useRateEstimate() {
  return useMutation<RateEstimate, ApiError, RateEstimatePayload>({
    mutationFn: (payload) => publicRateService.estimate(payload),
    retry: false,
  });
}
