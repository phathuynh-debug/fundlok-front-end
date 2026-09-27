import { apiClient } from "@/lib/api-client";
import { RATE_CALCULATOR_ENDPOINTS } from "@/lib/endpoints";

export interface RateCalculateRequest {
  industry: string;
  operating_months: number;
  employee_count: number;
  revenue_l12m: number | string;
  revenue_prev_12m: number | string;
  cogs_l12m: number | string;
  fixed_costs_l12m: number | string;
  variable_costs_l12m: number | string;
  requested_amount: number | string; // 20,000,000 to 1,000,000,000 VND
  tenor_months: number; // 1 to 6
  seasonality?: {
    peak_month_revenue?: number | string | null;
    lowest_month_revenue?: number | string | null;
    top_1_customer_share?: number | string | null; // 0 - 100
    top_3_customer_share?: number | string | null; // 0 - 100
  };
  session_id?: string | null;
  /**
   * Cloudflare Turnstile. The endpoint is public, unauthenticated, and writes a
   * row per call, so this is the only thing between it and a scripted insert
   * loop. Optional on the type because local dev runs with
   * NEXT_PUBLIC_DISABLE_TURNSTILE and the backend's verifier no-ops when no
   * secret is configured; any deployment with the secret set rejects a request
   * without it.
   */
  turnstile_token?: string | null;
}

export interface RateCalculateResponse {
  inquiry_id: string;
  status: "success";
  data: {
    rate_range: {
      min_rate_monthly: number;
      max_rate_monthly: number;
      apr_min: number;
      apr_max: number;
    };
    estimated_monthly_payment: {
      min: number;
      max: number;
    };
    risk_profile: {
      /**
       * A three-bucket projection of the grading engine's 0-100 score. The
       * numeric score is deliberately not sent: pricing is a single equation in
       * the score and the bank reference rate, so a caller holding both the
       * score and the rate can solve it for the reference rate.
       */
      tier: "TIER_A" | "TIER_B" | "TIER_C";
      /** The three below are the caller's own figures divided by each other. */
      growth_rate_pct: number;
      ebitda_margin_pct: number;
      debt_to_revenue_pct: number;
      is_operating_loss: boolean;
    };
    /**
     * Always true today. The engine brackets an unknown CIC score and assumes
     * identity checks pass, so this is an indicative band and never an offer.
     */
    provisional: boolean;
    /**
     * What the estimate took on faith, as codes to translate — e.g.
     * CIC_BRACKETED, KYC_ASSUMED_PASS, REVENUE_MODELLED, REVENUE_FLAT,
     * SECTOR_TABLE_DRAFT.
     */
    assumption_codes: string[];
  };
}

export interface RateInquiryAdminItem {
  id: string;
  created_at: string;
  created_at_formatted: string; // e.g. "26/09/2026 22:45"
  industry: string;
  industry_display: string; // e.g. "Retail FMCG"
  operating_months: number;
  employee_count: number;
  tenure_staff_display: string; // e.g. "36 mos / 25 staff"
  revenue_l12m: number;
  revenue_l12m_formatted: string; // e.g. "4.000.000.000 ₫"
  revenue_prev_12m: number;
  cogs_l12m: number;
  fixed_costs_l12m: number;
  variable_costs_l12m: number;
  yoy_growth_pct: number;
  yoy_growth_display: string; // e.g. "+25.0%"
  requested_amount: number;
  tenor_months: number;
  loan_ask_display: string; // e.g. "800M ₫ / 6 mos"
  estimated_rate_min: number;
  estimated_rate_max: number;
  calculated_rate_display: string; // e.g. "1.2% - 1.8% / mo"
  risk_tier: string | null;
  tier_display: string; // e.g. "Tier A"
  calculated_monthly_payment: number | null;
  calculated_monthly_payment_formatted: string | null; // e.g. "142.933.333 ₫"
  session_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  // Breakdown & additional risk metrics
  peak_month_revenue?: number | null;
  lowest_month_revenue?: number | null;
  top_1_customer_share?: number | null;
  top_3_customer_share?: number | null;
  apr_min?: number | null;
  apr_max?: number | null;
  growth_rate_pct?: number | null;
  ebitda_margin_pct?: number | null;
  debt_to_revenue_pct?: number | null;
  is_operating_loss?: boolean | null;
}

export interface RateInquiriesAdminListResponse {
  total: number;
  page: number;
  page_size: number;
  items: RateInquiryAdminItem[];
}

export interface RateInquiriesQueryParams {
  page?: number;
  page_size?: number;
  industry?: string;
  risk_tier?: string;
  search?: string;
}

export const ratesService = {
  calculate(payload: RateCalculateRequest) {
    return apiClient.post<RateCalculateResponse>(
      RATE_CALCULATOR_ENDPOINTS.calculate,
      payload,
    );
  },

  getInquiries(params: RateInquiriesQueryParams = {}) {
    return apiClient.get<RateInquiriesAdminListResponse>(
      RATE_CALCULATOR_ENDPOINTS.inquiries,
      { params },
    );
  },

  getInquiryDetail(inquiryId: string) {
    return apiClient.get<RateInquiryAdminItem>(
      RATE_CALCULATOR_ENDPOINTS.inquiryDetail(inquiryId),
    );
  },
};
