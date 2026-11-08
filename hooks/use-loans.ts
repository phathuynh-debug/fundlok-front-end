"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const loanKeys = {
  all: ["loans"] as const,
  serviceAgreement: (applicationId: string) =>
    [...loanKeys.all, "service-agreement", applicationId] as const,
};

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

/**
 * The SME Service Agreement for one application, as the PDF the SME reviews,
 * downloads and signs. Generated on the server from what FundLok holds (the
 * verified business, the approved bank account, the application's amount and
 * term), so it is fetched fresh each time the step opens rather than cached:
 * a bank account approved in the meantime must show up in it.
 */
export function useServiceAgreement(applicationId: string, enabled = true) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: loanKeys.serviceAgreement(applicationId),
    queryFn: () => loansService.getServiceAgreement(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
