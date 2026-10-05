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

/**
 * What the public /rate calculator asks a visitor for.
 *
 * Mirrors the backend's `PublicRateEstimateIn`. Three fields differ from the
 * design prototype, each because the grading engine cannot return a real
 * number without them: `industry` is one of the engine's own 15 industries
 * (not an invented bucket that would need mapping), `employee_count` is what
 * company size is derived from, and `revenue_prior_12m` is the second annual
 * total the monthly series is modelled from.
 */
export interface RateEstimatePayload {
  industry: string;
  operating_months: number;
  employee_count: number;
  revenue_last_12m: number;
  revenue_prior_12m: number;
  cogs_y1: number;
  fixed_cost_y1: number;
  variable_cost_excl_cogs_y1: number;
  loan_amount: number;
  duration_months: number;
  revenue_best_month: number | null;
  revenue_worst_month: number | null;
  conc_top1_pct: number | null;
  conc_top3_pct: number | null;
}

/**
 * A band, never a single rate — the visitor's CIC score is unknown, so the
 * engine runs at both ends of its calibrated range.
 *
 * Deliberately a smaller shape than the authenticated endpoint returns: no
 * params version, no sector reference version, no reference rate. This one is
 * rendered on a public page.
 */
export interface RateEstimate {
  rate_low_pct: number;
  rate_high_pct: number;
  score_low: number;
  score_high: number;
  engine_version: string;
  provisional: boolean;
  /** English prose — the fallback for a code this build has no string for. */
  assumptions: string[];
  /** Parallel to `assumptions`, same order. Translate by these. */
  assumption_codes: string[];
}

export const publicRateService = {
  async estimate(payload: RateEstimatePayload) {
    return apiClient.post<RateEstimate>(LOANS_ENDPOINTS.rateEstimate, payload);
  },
};
