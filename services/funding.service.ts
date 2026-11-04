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
  /** When the investor uploaded their transfer receipt; null until then. */
  receipt_submitted_at: string | null;
  /** In the investor's own list: the project the ticket is in. */
  project_id?: string | null;
  project_name?: string | null;
  /** Loan duration in months (from the project's funding window). */
  term_months?: number | null;
}

/** What the receipt upload is checked for, client-side, before it is sent. */
export const RECEIPT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

// Mirrors backend ReceiptResultOut.
export interface ReceiptResult {
  transfer_id: string;
  /** UNDER_REVIEW when the receipt came after the hold lapsed. */
  tranche_status: TrancheStatus;
  /** AWAITING_FIELDS: FundLok staff read the receipt (no automatic reading yet). */
  check_status: "AWAITING_FIELDS" | "MATCHED" | "MISMATCH" | "REJECTED" | "DUE";
  failure_codes: string[];
  confirmation_level: string;
}

/** One investor's ticket as the business sees it: the investor masked. */
export interface SmeTicket {
  id: string;
  amount_vnd: number;
  status: TrancheStatus;
  reference_code: string;
  /** e.g. "N. A***" */
  investor_display: string;
  attested_at: string | null;
  confirm_deadline: string | null;
  review_cause: string | null;
}

// Mirrors backend SmeRoundOut: the business's own round and its tickets.
export interface SmeRound extends FundingWindow {
  project_id: string;
  project_name: string;
  tickets: SmeTicket[];
  closing_started_at: string | null;
  close_wait_until: string | null;
  /** Set once the loan formed: the first repayment day. */
  repayment_start_date: string | null;
}

/** One day the business pays, summed over its investors. */
export interface SmeRepaymentDay {
  due_date: string;
  /** Investors' money coming back. */
  principal_vnd: number;
  /** Tax is withheld on this part only. */
  interest_vnd: number;
  /** What it owes that day: net to investors plus the tax it withholds. */
  gross_vnd: number;
  tax_withheld_vnd: number;
  net_vnd: number;
  /** Investors' tickets that day; paid / missing only once the loan formed. */
  tickets: number;
  paid: number;
  missing: number;
}

// Mirrors backend SmeRepaymentPlanOut.
export interface SmeRepaymentPlan {
  /** PROJECTED before the loan forms (not a promise), ACTUAL after. */
  kind: "PROJECTED" | "ACTUAL";
  assumed_close_date: string | null;
  start_date: string | null;
  days: SmeRepaymentDay[];
  totals: { gross_vnd: number; tax_withheld_vnd: number; net_vnd: number };
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

  // POST /funding/tranches/{id}/receipt — the investor's bank receipt for the
  // transfer. Replaying the same key returns the same result.
  uploadReceipt(trancheId: string, file: File, idempotencyKey: string) {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<ReceiptResult>(
      FUNDING_ENDPOINTS.receipt(trancheId),
      form,
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
  },

  // GET /funding/me/rounds — the business's rounds, newest first.
  listMyRounds() {
    return apiClient.get<SmeRound[]>(FUNDING_ENDPOINTS.myRounds);
  },

  // GET /funding/me/rounds/{id}/repayment-plan — the business's daily
  // repayments to its investors.
  getRepaymentPlan(windowId: string) {
    return apiClient.get<SmeRepaymentPlan>(
      FUNDING_ENDPOINTS.repaymentPlan(windowId),
    );
  },

  // POST /funding/windows/{id}/close-early — once the minimum is confirmed.
  closeEarly(windowId: string) {
    return apiClient.post<FundingWindow>(
      FUNDING_ENDPOINTS.closeEarly(windowId),
    );
  },

  // GET /funding/me/tranches — the investor's tickets, newest first.
  listMyTranches() {
    return apiClient.get<Tranche[]>(FUNDING_ENDPOINTS.myTranches);
  },
};
