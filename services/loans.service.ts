import { apiClient } from "@/lib/api-client";
import { LOANS_ENDPOINTS, type ListingDocumentKind } from "@/lib/endpoints";

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
 * What the automatic check on upload established: NEAC accepted the
 * signatures and they are the right signers', and the signed copy carries the
 * approved numbers (its check code matches).
 */
export interface ListingDocumentChecks {
  checked_at: string | null;
  verified_by: string | null;
  terms_match: boolean;
  signers: { role: "SME" | "GUARANTOR"; name: string | null }[];
}

/** One of the two documents the SME signs after approval. */
export interface SignedListingDocument {
  signed: boolean;
  signed_at: string | null;
  file_name: string | null;
  checks: ListingDocumentChecks | null;
}

/**
 * Where signing stands (GET /loans/applications/{id}/listing-documents).
 *
 * `ready`: approved with locked terms, so both documents carry them and can be
 * signed. `published`: the project is live; signing both is what publishes
 * it. `guarantor_verified`: the signing user has a verified identity (eKYC),
 * which the Standing Offer's Personal Guarantor signature is checked against.
 */
export interface ListingDocuments {
  ready: boolean;
  published: boolean;
  guarantor_verified: boolean;
  service_agreement: SignedListingDocument;
  standing_offer: SignedListingDocument;
}

/** The signed PDF's upload limit (the backend's, 25 MB). */
export const SIGNED_DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

export const loansService = {
  async submitApplication(applicationId: string) {
    return apiClient.post<LoanApplicationSubmitResponse>(
      LOANS_ENDPOINTS.submit(applicationId),
    );
  },

  /** The filled-in SME Service Agreement PDF, to preview and download. */
  async getServiceAgreement(applicationId: string) {
    return apiClient.getFile(LOANS_ENDPOINTS.serviceAgreement(applicationId));
  },

  /** The filled-in Standing Offer PDF, once the request is approved. */
  async getStandingOffer(applicationId: string) {
    return apiClient.getFile(LOANS_ENDPOINTS.standingOffer(applicationId));
  },

  async getListingDocuments(applicationId: string) {
    return apiClient.get<ListingDocuments>(
      LOANS_ENDPOINTS.listingDocuments(applicationId),
    );
  },

  /** The signed copy of one document. The backend checks it with NEAC. */
  async uploadSignedListingDocument(
    applicationId: string,
    kind: ListingDocumentKind,
    file: File,
  ) {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<ListingDocuments>(
      LOANS_ENDPOINTS.signListingDocument(applicationId, kind),
      form,
      // The backend verifies the signatures with NEAC (up to 45 s): wait
      // longer than that, so a slow check is not reported as a failure here.
      { timeout: 60_000 },
    );
  },

  async getSignedListingDocument(
    applicationId: string,
    kind: ListingDocumentKind,
  ) {
    return apiClient.getFile(
      LOANS_ENDPOINTS.signedListingDocument(applicationId, kind),
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
