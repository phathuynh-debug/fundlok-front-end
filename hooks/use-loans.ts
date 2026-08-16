"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  loansService,
  type LoanApplicationSubmitResponse,
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
