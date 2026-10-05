// Frontend-only sample data for the SME side of /dashboard/analytics.
//
// FE-013: the investor screen answers "how is my portfolio performing" —
// capital deployed, returns received, allocation across industries. None of
// those exist for a borrower. An SME has ONE facility and three questions
// about it:
//
//   1. What do I still owe, and what is it costing me?
//   2. How much of my daily revenue is going out the door, and is that safe?
//   3. Why is my score what it is, and what moves it?
//
// So this is a different dataset, not the investor one relabelled. Same
// reasoning as the other mocks in this folder: no backend supplies any of it
// yet (the scoring engine is not wired into POST /underwriting/score-runs, and
// there is no repayment schedule module), so it sits outside services/ rather
// than pretending to be the real data pipeline. When those land, move the types
// into a service, add the endpoint/service/hook layers, delete the MOCK_*
// constants and read from the hook. The derive* helpers are pure and move
// across unchanged.
//
// All money is VND. Timestamps are fixed ISO strings so the screen renders
// identically on every load.
//
// HANDBOOK CONSTRAINTS (fundlok-domain §2, §4):
//   * Term is 1 to 6 months. Six is the maximum.
//   * The score is 0-100 and is a reference input, never a rating or a
//     "grade" — that word is avoided in the data and in the copy, in both
//     locales.
//   * The backstop date is shown, because the SME knows it from signing.
//   * The rate is all-in and capped at the statutory ceiling.

import {
  backstopDate,
  BUSINESS_DAYS_PER_PERIOD,
  RATE_CEILING_PCT,
  type TermMonths,
} from "@/lib/facility-terms";

export { RATE_CEILING_PCT };

export interface RepaymentMonth {
  /** ISO year-month, e.g. "2026-08". */
  month: string;
  /** Collected across this month's business days, VND. */
  repaid: number;
  /** Cumulative repaid to date, VND. */
  repaid_cumulative: number;
  /**
   * Share of that month's revenue that went to repayment, as a decimal.
   * The scoring engine's soft gate 8 fires at 0.30 — above that a facility is
   * considered unaffordable, so it is the line an SME needs to see.
   */
  revenue_share: number;
}

/** One of the scoring engine's four group premiums, 0-100. */
export interface ScoreFactor {
  /** i18n key suffix under dashboard.smeAnalytics.factors. */
  key: "bcq" | "rsg" | "sector" | "behavioral";
  score: number;
  /** Weight in the final score — 0.40 / 0.25 / 0.25 / 0.10 per the engine. */
  weight: number;
}

export interface SmeFacility {
  /** Principal disbursed, VND. */
  principal: number;
  /**
   * Everything owed across the term, as set on the day the contract was
   * signed. A good month never shrinks it; if revenue drops and the term
   * stretches, interest on the extra time is added (stretchedTerm in
   * lib/facility-terms.ts). This sample facility has not stretched.
   */
  total_obligation: number;
  /** The all-in annual rate, capped at the statutory ceiling. */
  interest_rate_pct: number;
  /** Declared term: 1 to 6 months. */
  term_months: TermMonths;
  /** When the facility was disbursed — the backstop counts from here. */
  disbursed_at: string;
  /** Business days remaining in the declared term. */
  days_remaining: number;
  /** The fixed amount charged each business day, VND. */
  target_daily: number;
  /** What the current true-up period totals across its business days, VND. */
  current_period_total: number;
  current_period_end_date: string;
  /** Consecutive on-time business days — feeds the behavioural premium. */
  on_time_streak: number;
  // No "interest saved by early repayment" field: Handbook §5.9 fixes the
  // origination total at signing, and early settlement clears the remaining
  // total with no rebate. Closing early costs nothing extra and saves nothing
  // — the amount to settle today is simply the outstanding balance, derived in
  // deriveRepaymentSummary().
  /** Final score from the last locked score run, 0-100. */
  score: number;
}

export const MOCK_SME_FACILITY: SmeFacility = {
  principal: 800_000_000,
  // 800,000,000 at 14.32%/yr over six months, spread across the 126
  // business days in the term: 6,803,810 x 126 = 857,280,060.
  total_obligation: 857_280_060,
  interest_rate_pct: 14.32,
  term_months: 6,
  disbursed_at: "2026-04-01",
  // Five months in, one to go: 1 x 21 business days.
  days_remaining: 21,
  target_daily: 6_803_810,
  current_period_total: 142_880_010,
  current_period_end_date: "2026-09-30",
  on_time_streak: 5,
  score: 70.98,
};

// Five months into a six-month term, 6,803,810 x 21 business days collected
// each month. Revenue share drifts down as revenue grows against a fixed daily
// amount — the shape an SME should expect.
export const MOCK_REPAYMENT_MONTHS: RepaymentMonth[] = [
  {
    month: "2026-04",
    repaid: 142_880_010,
    repaid_cumulative: 142_880_010,
    revenue_share: 0.31,
  },
  {
    month: "2026-05",
    repaid: 142_880_010,
    repaid_cumulative: 285_760_020,
    revenue_share: 0.29,
  },
  {
    month: "2026-06",
    repaid: 142_880_010,
    repaid_cumulative: 428_640_030,
    revenue_share: 0.27,
  },
  {
    month: "2026-07",
    repaid: 142_880_010,
    repaid_cumulative: 571_520_040,
    revenue_share: 0.26,
  },
  {
    month: "2026-08",
    repaid: 142_880_010,
    repaid_cumulative: 714_400_050,
    revenue_share: 0.24,
  },
];

// Premiums from the worked example in the scoring spec (SME-0001), so the
// numbers on screen reconcile with the engine's own documentation.
export const MOCK_SCORE_FACTORS: ScoreFactor[] = [
  { key: "bcq", score: 71.24, weight: 0.4 },
  { key: "rsg", score: 81.52, weight: 0.25 },
  { key: "sector", score: 75.46, weight: 0.25 },
  { key: "behavioral", score: 32.42, weight: 0.1 },
];

/** The affordability ceiling the engine's gate 8 enforces. */
export const REVENUE_SHARE_CEILING = 0.3;

export { BUSINESS_DAYS_PER_PERIOD };

export interface SmeRepaymentSummary {
  repaid: number;
  outstanding: number;
  /** Repaid as a share of the total obligation, 0-100. */
  progress_pct: number;
  /** Total cost of the facility across the term, VND. */
  cost_of_capital: number;
  /** Latest month's revenue share, decimal. */
  latest_revenue_share: number;
  /** The hard deadline at 1.33x the declared term. */
  backstop_date: string;
}

export function deriveRepaymentSummary(
  facility: SmeFacility,
  months: RepaymentMonth[],
): SmeRepaymentSummary {
  const repaid = months.length
    ? months[months.length - 1].repaid_cumulative
    : 0;
  const latest = months.length ? months[months.length - 1].revenue_share : 0;
  return {
    repaid,
    // From the fixed total — relief changes how long collection runs, never
    // how much is owed.
    outstanding: facility.total_obligation - repaid,
    progress_pct:
      facility.total_obligation === 0
        ? 0
        : (repaid / facility.total_obligation) * 100,
    cost_of_capital: facility.total_obligation - facility.principal,
    latest_revenue_share: latest,
    backstop_date: backstopDate(facility.disbursed_at, facility.term_months),
  };
}

/** The weakest group premium — the one an SME should work on first. */
export function weakestFactor(factors: ScoreFactor[]): ScoreFactor | null {
  if (!factors.length) return null;
  return factors.reduce((worst, item) =>
    item.score < worst.score ? item : worst,
  );
}
