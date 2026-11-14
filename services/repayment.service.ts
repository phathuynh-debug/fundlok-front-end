import { apiClient } from "@/lib/api-client";
import { REPAYMENT_ENDPOINTS } from "@/lib/endpoints";

// Daily repayment once a round has formed its loan (backend
// app/market/repayment_router.py; spec repayment-collection.md section 4).
// The business pays each investor directly, one transfer per investor and day.

export type RepaymentDayStatus =
  "DUE" | "PRESUMED_PAID" | "REPORTED_MISSED" | "MATCHED";

export interface RepaymentPayee {
  bank_name: string;
  bank_bin: string;
  account_number: string;
  account_name: string;
}

// Mirrors backend RepaymentRowOut: one investor's payment for one day.
export interface RepaymentRow {
  repayment_day_id: string;
  tranche_id: string;
  /** STUB: interest for the days between transfer and the loan's start. */
  kind: "INSTALMENT" | "STUB";
  /** Masked, e.g. "N. A***". */
  investor_display: string;
  due_date: string;
  principal_vnd: number;
  interest_vnd: number;
  gross_vnd: number;
  /** Personal income tax the business withholds (individual investors). */
  tax_withheld_vnd: number;
  /** What the business transfers: gross less the tax withheld. */
  net_vnd: number;
  status: RepaymentDayStatus;
  /** The investor can report the day missing until this. */
  report_deadline: string;
  payee: RepaymentPayee | null;
  /** The memo the transfer must carry. */
  reference_code: string;
  /** VietQR for the exact net amount; null when nothing is to transfer. */
  vietqr_payload: string | null;
}

export interface TodaysPayments {
  date: string;
  rows: RepaymentRow[];
  totals: { gross_vnd: number; tax_withheld_vnd: number; net_vnd: number };
}

/** One projected day: what a ticket would be paid, if the round closed on
 *  the assumed date. Never a promise. */
export interface ProjectedDay {
  kind: "INSTALMENT" | "STUB";
  day_index: number;
  due_date: string;
  principal_vnd: number;
  interest_vnd: number;
  gross_vnd: number;
  tax_withheld_vnd: number;
  net_vnd: number;
}

/** Mirrors backend ProjectionBasisOut: each step of the arithmetic. Rates are
 *  percentages, sent as decimal strings. */
export interface ProjectionBasis {
  principal_vnd: number;
  /** The business's yearly rate. */
  loan_rate_pct: string;
  /** The investors' return over the whole loan (e.g. "2.5"). */
  investor_return_pct: string | null;
  /** That return as a yearly rate, never above the business's. */
  investor_rate_pct: string;
  term_months: number;
  working_days_per_month: number;
  business_day_count: number;
  interest_vnd: number;
  /** Principal plus interest. */
  total_vnd: number;
  daily_vnd: number;
  /** The last day: the daily amount plus the leftover. */
  final_vnd: number;
  received_on: string;
  approved_on: string;
  start_date: string;
  end_date: string;
  stub_days: number;
  stub_basis_days: number;
  stub_interest_vnd: number;
  individual: boolean;
  withholding_pct: string;
  tax_vnd: number;
}

// Mirrors backend ProjectedScheduleOut.
export interface ProjectedSchedule {
  /** The round's last day: the latest it can close, so the latest dates. */
  assumed_close_date: string;
  start_date: string;
  business_day_count: number;
  days: ProjectedDay[];
  totals: { gross_vnd: number; tax_withheld_vnd: number; net_vnd: number };
  basis?: ProjectionBasis | null;
}

// Mirrors backend InvestmentDueOut: what the business owes one investor now,
// as one transfer (every day due today or earlier and not yet marked paid).
export interface InvestmentDue {
  date: string;
  tranche_id: string;
  reference_code: string;
  investor_display: string;
  days: RepaymentRow[];
  gross_vnd: number;
  tax_withheld_vnd: number;
  /** What to transfer: the QR's amount. */
  net_vnd: number;
  payee: RepaymentPayee | null;
  /** VietQR for the whole amount; null when nothing is due. */
  vietqr_payload: string | null;
  /** Set when a day here is due again because staff denied its receipt
   *  (before investors confirmed repayments themselves). */
  rejection: { reason: string; decided_at: string } | null;
}

/** A bank account a repayment moved between. */
export interface RepaymentReceiptAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

/** One day a business's receipt pays the investor for. */
export interface RepaymentReceiptDay {
  repayment_day_id: string;
  kind: "INSTALMENT" | "STUB";
  due_date: string;
  principal_vnd: number;
  interest_vnd: number;
  gross_vnd: number;
  tax_withheld_vnd: number;
  net_vnd: number;
  status: RepaymentDayStatus;
}

export type RepaymentReceiptStatus =
  "AWAITING_CONFIRMATION" | "CONFIRMED" | "REJECTED";

/** Mirrors backend RepaymentSystemCheckOut: what the system read off the
 *  business's receipt, as advice. Never a confirmation: only the investor's
 *  own account shows the money arrived. */
export interface RepaymentSystemCheck {
  result: "MATCHES" | "DOES_NOT_MATCH" | "UNSURE";
  /** For DOES_NOT_MATCH: what differs, e.g. AMOUNT_MISMATCH. */
  failure_codes: string[];
  checked_at: string;
}

// Mirrors backend RepaymentReceiptOut: a receipt the business uploaded for
// repaying the investor, and the days it pays.
export interface RepaymentReceipt {
  /** The receipt file. */
  id: string;
  tranche_id: string;
  /** The memo the business's transfer carries. */
  reference_code: string;
  project_name: string;
  submitted_at: string;
  /** AWAITING_CONFIRMATION until the investor says it arrived. */
  status: RepaymentReceiptStatus;
  confirmed_at: string | null;
  gross_vnd: number;
  tax_withheld_vnd: number;
  /** What should have reached the investor's account. */
  net_vnd: number;
  days: RepaymentReceiptDay[];
  /** The investor's own account the money should reach. */
  payee: RepaymentReceiptAccount | null;
  /** The business's account it came from. */
  payer: RepaymentReceiptAccount | null;
  original_filename: string | null;
  content_type: string | null;
  /** The investor reported one of these days as never arriving; confirming
   *  closes that report as paid. */
  open_report: boolean;
  /** What the system read off the receipt; null when it was not read. */
  system_check?: RepaymentSystemCheck | null;
}

export type RepaymentReceiptFilter = "AWAITING" | "ALL";

export const repaymentService = {
  // GET /repayment/today — due today or earlier and not yet settled.
  getToday() {
    return apiClient.get<TodaysPayments>(REPAYMENT_ENDPOINTS.today);
  },

  // POST /repayment/days/{id}/report-missing — the investor says a due day
  // never arrived.
  reportMissing(dayId: string, statement: string | null) {
    return apiClient.post<RepaymentRow>(
      REPAYMENT_ENDPOINTS.reportMissing(dayId),
      { statement },
    );
  },

  // GET /repayment/tranches/{id}/projection — a confirmed ticket's projected
  // days, before the loan forms.
  getProjection(trancheId: string) {
    return apiClient.get<ProjectedSchedule>(
      REPAYMENT_ENDPOINTS.projection(trancheId),
    );
  },

  // GET /repayment/tranches/{id}/due — the business: what it owes this
  // investor now.
  getDue(trancheId: string) {
    return apiClient.get<InvestmentDue>(REPAYMENT_ENDPOINTS.due(trancheId));
  },

  // POST /repayment/tranches/{id}/pay — the business's transfer receipt; the
  // days are marked paid in the same step. Replaying the key repeats nothing.
  payWithReceipt(
    trancheId: string,
    repaymentDayIds: string[],
    file: File,
    idempotencyKey: string,
  ) {
    const form = new FormData();
    for (const id of repaymentDayIds) form.append("repayment_day_ids", id);
    form.append("file", file);
    return apiClient.post<RepaymentRow[]>(
      REPAYMENT_ENDPOINTS.pay(trancheId),
      form,
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
  },

  // GET /repayment/tranches/{id}/schedule — every day of one ticket.
  getSchedule(trancheId: string) {
    return apiClient.get<RepaymentRow[]>(
      REPAYMENT_ENDPOINTS.schedule(trancheId),
    );
  },

  // GET /repayment/receipts — the investor: receipts businesses uploaded for
  // paying them, the unconfirmed ones by default.
  getReceipts(status: RepaymentReceiptFilter = "AWAITING") {
    return apiClient.get<RepaymentReceipt[]>(REPAYMENT_ENDPOINTS.receipts, {
      params: { status },
    });
  },

  // POST /repayment/receipts/{id}/confirm — the investor received it: the
  // days it pays are settled. Final.
  confirmReceipt(receiptId: string) {
    return apiClient.post<RepaymentReceipt>(
      REPAYMENT_ENDPOINTS.confirmReceipt(receiptId),
    );
  },
};
