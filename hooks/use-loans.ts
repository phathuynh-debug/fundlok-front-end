"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  loansService,
  type IndicativeRate,
  type LoanApplicationFiguresPayload,
  type LoanApplicationSubmitResponse,
} from "@/services/loans.service";
import { projectKeys } from "@/hooks/use-projects";

export const loanKeys = {
  all: ["loans"] as const,
  indicativeRate: (applicationId: string) =>
    [...loanKeys.all, "indicative-rate", applicationId] as const,
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
    onSuccess: (_data, { applicationId }) => {
      // The figures are part of the application record the dashboard reads.
      queryClient.invalidateQueries({ queryKey: projectKeys.mine() });
      // The band is derived entirely from these figures, so a save makes any
      // band already on screen stale by definition.
      queryClient.invalidateQueries({
        queryKey: loanKeys.indicativeRate(applicationId),
      });
    },
  });
}

/**
 * The indicative rate band for an application's saved figures.
 *
 * Only runs once `enabled` — the caller passes false until the figures have
 * actually been saved, because before that the endpoint correctly 409s and
 * retrying it would just spend requests confirming the applicant has not
 * finished typing.
 *
 * `retry: false` for the same reason: every error this endpoint returns is a
 * 409 describing something the applicant has to change (a missing term, costs
 * above revenue). Retrying cannot fix any of them.
 */
export function useIndicativeRate(applicationId: string, enabled: boolean) {
  return useQuery<IndicativeRate, ApiError>({
    queryKey: loanKeys.indicativeRate(applicationId),
    queryFn: () => loansService.getIndicativeRate(applicationId),
    enabled: enabled && Boolean(applicationId),
    retry: false,
    // The band is a pure function of stored figures and a versioned params
    // file, so a cached one stays correct until a save invalidates it.
    staleTime: 5 * 60 * 1000,
  });
}
