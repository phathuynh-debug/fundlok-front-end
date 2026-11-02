import { apiClient } from "@/lib/api-client";
import { FUNDING_ENDPOINTS } from "@/lib/endpoints";

// Each side's own money (backend app/market/portfolio.py), read from the
// direct-transfer tickets, repayment days and fee invoices. The investor:
// every investment they sent a business, every day it repaid them, and their
// portfolio month by month. The business: every investment it received, every
// day it repaid an investor, FundLok's fee invoices, and its loan. The money
// moves between the investor's bank and the business's (ADR-009).

export type TransactionType =
  | "INVESTMENT"
  | "RETURN"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "REPAYMENT"
  | "FEE"
  // Borrower-side movements. An SME never invests or receives a distribution;
  // it receives a disbursement and repays.
  | "DISBURSEMENT"
  | "EARLY_REPAYMENT";

export type TransactionStatus = "COMPLETED" | "PENDING" | "FAILED";

// Mirrors backend TransactionOut: one movement of the caller's money, signed
// from their side. The investor: INVESTMENT and RETURN. The business:
// DISBURSEMENT (an investment in), REPAYMENT (out, to an investor) and FEE.
// COMPLETED: received, matched by FundLok, or paid. PENDING: being checked,
// the business's word that it paid, or an invoice unpaid. FAILED: voided, or
// the investor reported the repayment never arrived. A repayment is one row
// per working day, the first-period interest folded in.
export interface Transaction {
  id: string;
  /** The investment it belongs to; null for a fee, absent on sample rows. */
  tranche_id?: string | null;
  /** Human-facing reference shown in the table and in receipts. */
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  /** ISO-8601. Rendered with formatDate/formatDateTime so vi gets DD/MM/YYYY. */
  created_at: string;
  /**
   * Signed: negative is money leaving the investor (investments), positive is
   * money arriving (a repayment, after the tax the business keeps back).
   * Storing the sign rather than a direction flag keeps the summary maths a
   * plain sum.
   */
  amount: number;
  currency: "VND";
  /** Project or company the movement relates to; "—" for account-level items. */
  counterparty: string;
  /**
   * How the money moved, as an i18n key under `dashboard.transactions.methods`
   * — a key, never free text, so no bank is ever named on screen.
   */
  method_key: string;
  /** Masked account reference shown after the method, e.g. "••••4417". */
  method_ref?: string;
}

export interface MonthlyPoint {
  /** ISO year-month, e.g. "2026-08". */
  month: string;
  /** Cumulative capital invested to date, VND. */
  deployed_cumulative: number;
  /** Cumulative money received back to date: capital AND earnings. */
  returns_cumulative: number;
  /** Money received back in this month alone: capital + earnings. */
  returns_monthly: number;
  /** The capital half of `returns_monthly` — not profit. */
  principal_monthly: number;
  /** The earnings half (interest after tax) — the only part that is profit.
   *  `principal_monthly + yield_monthly === returns_monthly`. */
  yield_monthly: number;
}

export interface IndustryAllocation {
  industry: string;
  /** Capital invested in this industry, VND. */
  deployed: number;
}

export interface CapitalStatusAllocation {
  statusKey: "active" | "repaying" | "completed" | "writtenDown";
  amount: number;
}

// Mirrors backend InvestorAnalyticsOut. `monthly` runs from 12 months back
// (or the first investment) to this month; empty with no investment received.
export interface InvestorAnalytics {
  monthly: MonthlyPoint[];
  allocation: IndustryAllocation[];
  capital_status: CapitalStatusAllocation[];
  active_positions: number;
}

/** The business's loan: the sum of its investments, each repaying on its own.
 *  Mirrors backend SmeFacilityOut. */
export interface SmeFacility {
  /** The investments received, VND. */
  principal: number;
  /** Every repayment day, tax included: the investors' tax is kept back by
   *  the business but owed all the same. Fixed at approval; if revenue drops
   *  and the term stretches, interest on the extra time is added. */
  total_obligation: number;
  /** The investors' yearly rate; FundLok's fee is invoiced separately. */
  interest_rate_pct: number;
  /** Declared term: 1 to 6 months. */
  term_months: number;
  /** When the first investment was received — the backstop counts from here. */
  disbursed_at: string;
  /** Working days still to pay. */
  days_remaining: number;
  /** The next unpaid day, all investors, VND. */
  target_daily: number;
  /** This month's days, VND, to their last date. */
  current_period_total: number;
  current_period_end_date: string;
  /** Working days paid in a row. */
  on_time_streak: number;
  /** The business score the round was offered on, 0-100; null without one. */
  score: number | null;
}

export interface RepaymentMonth {
  /** ISO year-month, e.g. "2026-08". */
  month: string;
  /** Repaid this month, tax included, VND. */
  repaid: number;
  repaid_cumulative: number;
  /** `repaid` against the average monthly revenue the loan was sized on, as a
   *  decimal; 0 without one. */
  revenue_share: number;
}

/** One of the business score's four groups, 0-100, and its weight. */
export interface ScoreFactor {
  /** i18n key suffix under dashboard.smeAnalytics.factors. */
  key: "bcq" | "rsg" | "sector" | "behavioral";
  score: number;
  /** 0.40 / 0.25 / 0.25 / 0.10. */
  weight: number;
}

// Mirrors backend BusinessAnalyticsOut. `facility` is null until an
// investment repays.
export interface BusinessAnalytics {
  facility: SmeFacility | null;
  months: RepaymentMonth[];
  score_factors: ScoreFactor[];
  /** The average monthly revenue (last 12 months filed); null without one. */
  revenue_basis_vnd: number | null;
}

export const portfolioService = {
  // GET /funding/me/transactions — newest first.
  getMyTransactions() {
    return apiClient.get<Transaction[]>(FUNDING_ENDPOINTS.myTransactions);
  },

  // GET /funding/me/analytics
  getMyAnalytics() {
    return apiClient.get<InvestorAnalytics>(FUNDING_ENDPOINTS.myAnalytics);
  },

  // GET /funding/me/business-transactions — the business, newest first.
  getBusinessTransactions() {
    return apiClient.get<Transaction[]>(FUNDING_ENDPOINTS.businessTransactions);
  },

  // GET /funding/me/business-analytics
  getBusinessAnalytics() {
    return apiClient.get<BusinessAnalytics>(
      FUNDING_ENDPOINTS.businessAnalytics,
    );
  },
};
