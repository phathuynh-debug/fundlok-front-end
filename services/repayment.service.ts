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

// Mirrors backend ProjectedScheduleOut.
export interface ProjectedSchedule {
  /** The round's last day: the latest it can close, so the latest dates. */
  assumed_close_date: string;
  start_date: string;
  business_day_count: number;
  days: ProjectedDay[];
  totals: { gross_vnd: number; tax_withheld_vnd: number; net_vnd: number };
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
  /** Set when a day here is due again because staff denied its receipt. */
  rejection: { reason: string; decided_at: string } | null;
}

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
};
