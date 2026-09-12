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

/**
 * An indicative interest band for an application. Mirrors the backend's
 * `IndicativeRateOut`.
 *
 * It is a RANGE by construction and there is deliberately no single-figure
 * variant: the applicant's CIC score is unknown before KYC, so the engine runs
 * at both ends of its calibrated range and the two rates bracket the answer. A
 * point estimate would read as a quote.
 *
 * `assumptions` is not decoration — each entry names something the band took on
 * faith, and the UI is required to show them next to the numbers.
 */
export interface IndicativeRate {
  rate_low_pct: number;
  rate_high_pct: number;
  grade_low: number;
  grade_high: number;
  decision_low: string;
  decision_high: string;
  engine_version: string;
  params_version: string;
  sector_reference_version: string;
  /** True while the sector reference table is still awaiting sign-off. */
  provisional: boolean;
  assumptions: string[];
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

  async getIndicativeRate(applicationId: string) {
    return apiClient.get<IndicativeRate>(
      LOANS_ENDPOINTS.indicativeRate(applicationId),
    );
  },
};
