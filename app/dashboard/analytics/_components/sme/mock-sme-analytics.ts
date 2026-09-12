// Frontend-only sample data for the SME side of /dashboard/analytics.
//
// FE-013: the investor screen answers "how is my portfolio performing" —
// capital deployed, returns received, ROI, allocation across industries. None
// of those exist for a borrower. An SME has ONE loan and three questions about
// it:
//
//   1. What do I still owe, and what is it costing me?
//   2. How much of my daily revenue is going out the door, and is that safe?
//   3. Why is my grade what it is, and what moves it?
//
// So this is a different dataset, not the investor one relabelled. Same
// reasoning as the other mocks in this folder: no backend supplies any of it
// yet (the grading engine is not wired into POST /underwriting/score-runs, and
// there is no repayment schedule module), so it sits outside services/ rather
// than pretending to be the real data pipeline. When those land, move the types
// into a service, add the endpoint/service/hook layers, delete the MOCK_*
// constants and read from the hook. The derive* helpers are pure and move
// across unchanged.
//
// All money is VND. Timestamps are fixed ISO strings so the screen renders
// identically on every load.

export interface RepaymentMonth {
  /** ISO year-month, e.g. "2026-08". */
  month: string;
  /** Principal + interest repaid in this month alone, VND. */
  repaid: number;
  /** Cumulative repaid to date, VND. */
  repaid_cumulative: number;
  /**
   * Share of that month's revenue that went to repayment, as a decimal.
   * The grading engine's soft gate 8 fires at 0.30 — above that a loan is
   * considered unaffordable, so it is the line an SME needs to see.
   */
  revenue_share: number;
}

/** One of the grading engine's four group premiums, 0-100. */
export interface GradeFactor {
  /** i18n key suffix under dashboard.smeAnalytics.factors. */
  key: "bcq" | "rsg" | "sector" | "behavioral";
  score: number;
  /** Weight in the final grade — 0.40 / 0.25 / 0.25 / 0.10 per the engine. */
  weight: number;
}

export interface SmeLoan {
  /** Principal disbursed, VND. */
  principal: number;
  /** Total to repay over the term (principal + interest), VND. */
  total_obligation: number;
  /** Priced rate from the grading engine. */
  interest_rate_pct: number;
  term_months: number;
  /** Working days remaining in the term. */
  days_remaining: number;
  /** The engine's target daily repayment, VND. */
  target_daily: number;
  /** Next scheduled instalment. */
  next_payment: number;
  next_payment_date: string;
  /** Consecutive on-time payments — feeds the behavioral premium. */
  on_time_streak: number;
  // No "interest saved by early repayment" field: Handbook §5.9 fixes the
  // origination total at signing, and early settlement clears the remaining
  // total with no rebate. Closing early costs nothing extra and saves nothing
  // — the amount to settle today is simply the outstanding balance, derived in
  // deriveRepaymentSummary().
  /** Final grade from the last locked score run, 0-100. */
  grade: number;
}

export const MOCK_SME_LOAN: SmeLoan = {
  principal: 800_000_000,
  total_obligation: 885_927_792,
  interest_rate_pct: 14.32,
  term_months: 9,
  days_remaining: 94,
  target_daily: 4_687_448,
  next_payment: 98_436_421,
  next_payment_date: "2026-09-05",
  on_time_streak: 5,
  grade: 70.98,
};

// Five months into a nine-month term. Revenue share drifts down as revenue
// grows against a fixed instalment — the shape an SME should expect.
export const MOCK_REPAYMENT_MONTHS: RepaymentMonth[] = [
  {
    month: "2026-04",
    repaid: 98_436_421,
    repaid_cumulative: 98_436_421,
    revenue_share: 0.31,
  },
  {
    month: "2026-05",
    repaid: 98_436_421,
    repaid_cumulative: 196_872_842,
    revenue_share: 0.29,
  },
  {
    month: "2026-06",
    repaid: 98_436_421,
    repaid_cumulative: 295_309_263,
    revenue_share: 0.27,
  },
  {
    month: "2026-07",
    repaid: 98_436_421,
    repaid_cumulative: 393_745_684,
    revenue_share: 0.26,
  },
  {
    month: "2026-08",
    repaid: 98_436_421,
    repaid_cumulative: 492_182_105,
    revenue_share: 0.24,
  },
];

// Premiums from the worked example in the grading spec (SME-0001), so the
// numbers on screen reconcile with the engine's own documentation.
export const MOCK_GRADE_FACTORS: GradeFactor[] = [
  { key: "bcq", score: 71.24, weight: 0.4 },
  { key: "rsg", score: 81.52, weight: 0.25 },
  { key: "sector", score: 75.46, weight: 0.25 },
  { key: "behavioral", score: 32.42, weight: 0.1 },
];

/** The affordability ceiling the engine's gate 8 enforces. */
export const REVENUE_SHARE_CEILING = 0.3;

export interface SmeRepaymentSummary {
  repaid: number;
  outstanding: number;
  /** Repaid as a share of the total obligation, 0-100. */
  progress_pct: number;
  /** Total interest across the term, VND. */
  cost_of_capital: number;
  /** Latest month's revenue share, decimal. */
  latest_revenue_share: number;
}

export function deriveRepaymentSummary(
  loan: SmeLoan,
  months: RepaymentMonth[],
): SmeRepaymentSummary {
  const repaid = months.length
    ? months[months.length - 1].repaid_cumulative
    : 0;
  const latest = months.length ? months[months.length - 1].revenue_share : 0;
  return {
    repaid,
    outstanding: loan.total_obligation - repaid,
    progress_pct:
      loan.total_obligation === 0 ? 0 : (repaid / loan.total_obligation) * 100,
    cost_of_capital: loan.total_obligation - loan.principal,
    latest_revenue_share: latest,
  };
}

/** The weakest group premium — the one an SME should work on first. */
export function weakestFactor(factors: GradeFactor[]): GradeFactor | null {
  if (!factors.length) return null;
  return factors.reduce((worst, item) =>
    item.score < worst.score ? item : worst,
  );
}
