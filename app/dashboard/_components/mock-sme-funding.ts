// Frontend-only sample data for the SME half of /dashboard.
//
// The SME hero above this panel is REAL — legal name, industry, tax id and the
// loan-application state all come from useMyProjects(). What is mocked here is
// everything downstream of a signed contract: funding progress, disbursement,
// and the repayment schedule. Those live in app/ledger/, app/contracts/ and
// app/repayment_schedule/ on the backend and have no read API yet, so this sits
// outside services/ rather than pretending to be the real data pipeline.
//
// When those endpoints land: move the types into a service, add the
// endpoint/service/hook layers, delete the MOCK_* constants and read from the
// hook. `summarizeFunding` is pure and moves across unchanged.
//
// Amounts are VND integers; dates are fixed ISO strings so the screen renders
// identically on every load.
//
// HANDBOOK CONSTRAINTS (fundlok-domain §2) — this models the product we
// actually sell, not a bank loan:
//   * Repayment is a FIXED AMOUNT EACH BUSINESS DAY, not a monthly instalment
//     with a shifting principal/interest split. An amortisation table is bank
//     mechanics and describes a different product.
//   * The TOTAL REPAYABLE IS FIXED AT SIGNING. It does not grow because a
//     period went badly or shrink because one went well, so `outstanding` is
//     derived from that fixed total — never by summing future rows.
//   * RELIEF RUNS ONE WAY ONLY. If verified revenue falls short the daily
//     amount for that period drops and the facility runs LONGER; the total
//     owed is unchanged and we never ask for more after a strong period.
//   * The term is 6 or 12 months, and the BACKSTOP at 1.33x is shown, because
//     the SME knows that date from the day they sign.
//   * The score is 0-100. A letter grade ("B+") is rating-agency notation.

import {
  backstopDate,
  BUSINESS_DAYS_PER_PERIOD,
  RATE_CEILING_PCT,
  type TermMonths,
} from "@/lib/facility-terms";

export { backstopDate, BUSINESS_DAYS_PER_PERIOD, RATE_CEILING_PCT };
export type { TermMonths };

export type RepaymentPeriodStatus =
  /** Collected in full at the contractual daily amount. */
  | "SETTLED"
  /** Verified revenue fell short, so the daily amount for this period was
   *  reduced. The shortfall did not vanish — it extends the facility. */
  | "RELIEF_APPLIED"
  /** The period being collected now. */
  | "CURRENT"
  /** Still ahead. */
  | "UPCOMING";

export interface RepaymentPeriod {
  /** 1-based true-up period. */
  number: number;
  start_date: string;
  end_date: string;
  /** Business days in the period — the daily amount is charged on each. */
  business_days: number;
  /** Amount charged per business day across this period, VND. */
  daily_amount: number;
  /**
   * The contractual daily amount, present only on a RELIEF_APPLIED period so
   * the screen can show what changed and make clear relief moved DOWN.
   */
  contractual_daily_amount?: number;
  status: RepaymentPeriodStatus;
}

export interface SmeFunding {
  /** Amount asked for in the application, VND. */
  requested: number;
  /** Amount raised from investors so far, VND. */
  funded: number;
  /** Distinct investors in the syndicate. */
  investor_count: number;
  /**
   * 0-100 internal assessment from the last locked score run — a reference
   * input that moves the rate between the reference rate and the ceiling.
   */
  score: number;
  /**
   * The all-in annual rate. There is no second rate underneath it, and it is
   * capped at the statutory 20%/yr ceiling.
   */
  interest_rate_pct: number;
  /** Declared term: 6 or 12 months only. */
  term_months: TermMonths;
  /**
   * Everything owed, fixed on the day the contract was signed. Settling early
   * clears this balance; it does not reduce it.
   */
  total_repayable: number;
  /** The contractual fixed amount charged each business day, VND. */
  daily_amount: number;
  /**
   * The daily amount as a share of average daily verified revenue, as a
   * decimal. The engine's affordability gate sits at 0.30.
   */
  revenue_share: number;
  /** When the omnibus account paid out, or null while still funding. */
  disbursed_at: string | null;
}

export const MOCK_SME_FUNDING: SmeFunding = {
  requested: 1_000_000_000,
  funded: 875000000,
  investor_count: 14,
  score: 74,
  interest_rate_pct: 14.5,
  term_months: 6,
  // 875,000,000 at 14.5%/yr over six months, then divided across the 126
  // business days in the term: 7,447,917 x 126 = 938,437,542.
  total_repayable: 938437542,
  daily_amount: 7447917,
  // ~28.6M VND average daily revenue: comfortably under the 0.30 gate.
  revenue_share: 0.26,
  disbursed_at: "2026-05-18",
};

// Six true-up periods for a six-month term. Two collected in full, one where
// revenue fell short and relief brought the daily amount down, one running now.
//
// The relief period is the point of this dataset: it collects less, the total
// owed does not move, and the balance simply takes longer to clear — bounded
// by the backstop date.
export const MOCK_REPAYMENT_PERIODS: RepaymentPeriod[] = [
  {
    number: 1,
    start_date: "2026-05-18",
    end_date: "2026-06-16",
    business_days: BUSINESS_DAYS_PER_PERIOD,
    daily_amount: 7447917,
    status: "SETTLED",
  },
  {
    number: 2,
    start_date: "2026-06-17",
    end_date: "2026-07-16",
    business_days: BUSINESS_DAYS_PER_PERIOD,
    daily_amount: 7447917,
    status: "SETTLED",
  },
  {
    number: 3,
    start_date: "2026-07-17",
    end_date: "2026-08-14",
    business_days: BUSINESS_DAYS_PER_PERIOD,
    // Verified revenue came in under the true-up threshold, so the obligation
    // for this period dropped. Relief only ever moves in this direction.
    daily_amount: 5210000,
    contractual_daily_amount: 7447917,
    status: "RELIEF_APPLIED",
  },
  {
    number: 4,
    start_date: "2026-08-17",
    end_date: "2026-09-15",
    business_days: BUSINESS_DAYS_PER_PERIOD,
    daily_amount: 7447917,
    status: "CURRENT",
  },
  {
    number: 5,
    start_date: "2026-09-16",
    end_date: "2026-10-15",
    business_days: BUSINESS_DAYS_PER_PERIOD,
    daily_amount: 7447917,
    status: "UPCOMING",
  },
  {
    number: 6,
    start_date: "2026-10-16",
    end_date: "2026-11-16",
    business_days: BUSINESS_DAYS_PER_PERIOD,
    daily_amount: 7447917,
    status: "UPCOMING",
  },
];

export interface FundingSummary {
  /** Share of the ask raised, 0-100. */
  funded_pct: number;
  /** Collected so far across settled periods, VND. */
  repaid: number;
  /**
   * Still owed, VND. Derived as `total_repayable - repaid` — NOT as the sum of
   * the remaining rows. The total is fixed at signing, so a relief period
   * changes how long collection takes, never how much is owed.
   */
  outstanding: number;
  /** Periods collected, relief periods included. */
  settled_count: number;
  total_count: number;
  /** The period being collected now, or null once the schedule is finished. */
  current: RepaymentPeriod | null;
  /** The hard deadline at 1.33x the declared term. */
  backstop_date: string | null;
}

const isCollected = (status: RepaymentPeriodStatus) =>
  status === "SETTLED" || status === "RELIEF_APPLIED";

export const periodTotal = (period: RepaymentPeriod) =>
  period.daily_amount * period.business_days;

export function summarizeFunding(
  funding: SmeFunding,
  periods: RepaymentPeriod[],
): FundingSummary {
  const collected = periods.filter((p) => isCollected(p.status));
  const repaid = collected.reduce((sum, p) => sum + periodTotal(p), 0);

  return {
    funded_pct:
      funding.requested === 0
        ? 0
        : Math.round((funding.funded / funding.requested) * 1000) / 10,
    repaid,
    outstanding: funding.total_repayable - repaid,
    settled_count: collected.length,
    total_count: periods.length,
    // The schedule is authored in order, so the first uncollected row is the
    // one running now — no date comparison, which would drift as time passes
    // against these fixed dates.
    current: periods.find((p) => !isCollected(p.status)) ?? null,
    backstop_date: funding.disbursed_at
      ? backstopDate(funding.disbursed_at, funding.term_months)
      : null,
  };
}
