import { apiClient } from "@/lib/api-client";
import { LOANS_ENDPOINTS } from "@/lib/endpoints";

export interface LoanApplicationSubmitResponse {
  id: string;
  status: string;
}

/**
 * Figures the SME types on the VAT and annual-financials steps. Every value is
 * whole đồng except the `*_pct` fields, which are 0-100. `null` means the
 * applicant left an optional field blank — distinct from 0, which is a real
 * answer the grading engine would score.
 */
export interface LoanApplicationFiguresPayload {
  revenue_last_12m: number;
  revenue_prior_12m: number;
  revenue_best_month: number | null;
  revenue_worst_month: number | null;
  cogs_y1: number;
  fixed_cost_y1: number;
  variable_cost_excl_cogs_y1: number;
  owner_withdrawal_pct: number | null;
  conc_top1_pct: number | null;
  conc_top3_pct: number | null;
}

export const loansService = {
  async submitApplication(applicationId: string) {
    return apiClient.post<LoanApplicationSubmitResponse>(
      LOANS_ENDPOINTS.submit(applicationId),
    );
  },

  async saveFigures(
    applicationId: string,
    payload: LoanApplicationFiguresPayload,
  ) {
    return apiClient.put<LoanApplicationFiguresPayload>(
      LOANS_ENDPOINTS.figures(applicationId),
      payload,
    );
  },
};
