import { apiClient } from "@/lib/api-client";
import { FUNDING_ENDPOINTS } from "@/lib/endpoints";

/**
 * The version of the investing terms the investor reads (investment.terms in
 * lib/i18n). Must equal the backend's INVESTOR_TERMS_VERSION
 * (app/market/funding.py): change both with the text, or every reservation
 * answers 409 TERMS_OUTDATED.
 */
export const INVESTOR_TERMS_VERSION = "2026-10-30";

export type FundingWindowStatus =
  "OPEN" | "FULL" | "CLOSING" | "REPAYING" | "FAILED" | "REPAID" | "CANCELLED";

// Mirrors backend FundingWindowOut. Money is integer VND.
export interface FundingWindow {
  id: string;
  listing_id: string;
  status: FundingWindowStatus;
  target_vnd: number;
  /** Below this confirmed at close, no loan forms and transfers are refunded. */
  min_raise_vnd: number;
  min_ticket_vnd: number;
  /** Transfers the business has confirmed. */
  confirmed_vnd: number;
  /** Held by investors who have not finished paying yet. */
  reserved_vnd: number;
  /** What is still open: the most one ticket can take. */
  capacity_vnd: number;
  /** Decimal string, e.g. "16.000". */
  annual_rate_pct: string;
  term_months: number;
  window_start: string;
  window_end: string;
  days_left: number;
  tranche_count: number;
}

export type TrancheStatus =
  | "RESERVED"
  | "SIGNED"
  | "ATTESTED"
  | "CONFIRMED"
  | "ACTIVE"
  | "EXPIRED"
  | "UNDER_REVIEW"
  | "VOID";

/** A tranche in one of these still holds its place on the window. */
export const LIVE_TRANCHE_STATUSES: readonly TrancheStatus[] = [
  "RESERVED",
  "SIGNED",
  "ATTESTED",
  "CONFIRMED",
  "UNDER_REVIEW",
  "ACTIVE",
];

// Mirrors backend TrancheOut: one investor's ticket on a window.
export interface Tranche {
  id: string;
  window_id: string;
  status: TrancheStatus;
  amount_vnd: number;
  /** The payment memo: it ties the bank transfer to this ticket. */
  reference_code: string;
  /** Pay before this, or the hold lapses. */
  hold_expires_at: string;
  signed_at: string | null;
  attested_at: string | null;
}

export interface ReserveRequest {
  amount_vnd: number;
  ack_risk_disclosure: boolean;
  terms_version: string;
}

// Mirrors backend PaymentOut: where to send the money, straight to the business.
export interface PaymentInstructions {
  bank_name: string;
  bank_bin: string;
  account_number: string;
  account_name: string;
  amount_vnd: number;
  reference_code: string;
  /** EMVCo VietQR text with the amount and memo in it; rendered client-side. */
  vietqr_payload: string;
  hold_expires_at: string;
}

export const fundingService = {
  // GET /funding/listings/{id}/window — totals only, never other investors.
  getWindow(listingId: string) {
    return apiClient.get<FundingWindow>(FUNDING_ENDPOINTS.window(listingId));
  },

  // POST /funding/windows/{id}/reservations — holds the amount and signs the
  // acceptance of the terms. Replaying the same key returns the same ticket.
  reserve(windowId: string, body: ReserveRequest, idempotencyKey: string) {
    return apiClient.post<Tranche>(FUNDING_ENDPOINTS.reserve(windowId), body, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  // GET /funding/tranches/{id}/payment — the caller's own ticket only.
  getPayment(trancheId: string) {
    return apiClient.get<PaymentInstructions>(
      FUNDING_ENDPOINTS.payment(trancheId),
    );
  },

  // GET /funding/me/tranches — the investor's tickets, newest first.
  listMyTranches() {
    return apiClient.get<Tranche[]>(FUNDING_ENDPOINTS.myTranches);
  },
};
