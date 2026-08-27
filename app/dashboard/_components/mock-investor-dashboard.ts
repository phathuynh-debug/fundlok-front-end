// Frontend-only sample data for the INVESTOR half of /dashboard.
//
// Same reasoning as app/dashboard/analytics/_components/mock-analytics.ts:
// there is no portfolio/holdings API yet, so this deliberately sits outside
// services/ rather than pretending to be the real data pipeline. When the API
// lands, move the types into a service, add the endpoint/service/hook layers,
// delete the MOCK_* constants and read from the hook. `summarizePortfolio`
// below is pure and moves across unchanged.
//
// Amounts are VND integers — the platform has no sub-unit, and `formatCurrency`
// renders them. Dates are fixed ISO strings rather than Date.now() offsets so
// the screen renders identically on every load and in screenshots.
//
// Industry values are the grading engine's canonical strings from
// lib/constants/industries.ts, so getIndustryChrome() themes them and
// industryLabel() localises them. Inventing a label here would render an
// untinted card in Vietnamese.

/** Where a position sits in the lending lifecycle. */
export type HoldingStatus =
  /** Listing still filling; capital committed but not yet disbursed. */
  | "FUNDING"
  /** Disbursed, inside the grace period before the first installment. */
  | "ACTIVE"
  /** Receiving scheduled repayments. */
  | "REPAYING"
  /** Principal and interest returned in full. */
  | "COMPLETED";

export interface Holding {
  id: string;
  project_name: string;
  /** Canonical engine industry value. */
  industry: string;
  /** Capital committed to this position, VND. */
  invested: number;
  /** Principal + interest received back so far, VND. */
  returned: number;
  /** Contractual gross yield for the position, percent per annum. */
  expected_roi_pct: number;
  term_months: number;
  /** Share of the schedule already repaid, 0-100. */
  progress_pct: number;
  /** Next scheduled distribution, or null once COMPLETED. */
  next_payout_date: string | null;
  status: HoldingStatus;
}

// Six positions spanning the whole lifecycle, so every status badge and the
// zero-progress and full-progress ends of the bar are all visible at once.
// Ticket sizes sit between 150M and 700M VND — plausible against the
// 200M-5B loan range in lib/constants/loan-constraints.ts.
export const MOCK_HOLDINGS: Holding[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    project_name: "Mekong Agri Export",
    industry: "Agriculture & Farming",
    invested: 625000000,
    returned: 218750000,
    expected_roi_pct: 14.5,
    term_months: 12,
    progress_pct: 35,
    next_payout_date: "2026-09-05",
    status: "REPAYING",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    project_name: "TechStart Solutions",
    industry: "IT Services",
    invested: 450000000,
    returned: 46250000,
    expected_roi_pct: 12.0,
    term_months: 9,
    progress_pct: 10,
    next_payout_date: "2026-09-12",
    status: "REPAYING",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    project_name: "Saigon Coffee Roasters",
    industry: "Food & Beverage",
    invested: 300000000,
    returned: 345000000,
    expected_roi_pct: 15.0,
    term_months: 6,
    progress_pct: 100,
    next_payout_date: null,
    status: "COMPLETED",
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    project_name: "Da Nang Boutique Stays",
    industry: "Tourism & Hospitality",
    invested: 700000000,
    returned: 0,
    expected_roi_pct: 13.5,
    term_months: 12,
    progress_pct: 0,
    next_payout_date: "2026-09-28",
    status: "ACTIVE",
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    project_name: "Hanoi Textile Works",
    industry: "Textile & Garment",
    invested: 380000000,
    returned: 152000000,
    expected_roi_pct: 16.0,
    term_months: 9,
    progress_pct: 45,
    next_payout_date: "2026-09-08",
    status: "REPAYING",
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    project_name: "Binh Duong Logistics Hub",
    industry: "Logistics & Transport",
    invested: 150000000,
    returned: 0,
    expected_roi_pct: 11.5,
    term_months: 12,
    progress_pct: 0,
    next_payout_date: null,
    status: "FUNDING",
  },
];

export interface PortfolioSummary {
  /** Sum of every position, VND. */
  total_invested: number;
  /** Positions still owed money — everything except COMPLETED. */
  active_count: number;
  /** Principal + interest received across all positions, VND. */
  total_returns: number;
  /**
   * Capital-weighted average expected yield, percent. Weighted rather than a
   * plain mean: a 700M position at 13.5% and a 150M one at 11.5% do not
   * contribute equally to what the portfolio actually earns.
   */
  weighted_roi_pct: number;
}

export function summarizePortfolio(holdings: Holding[]): PortfolioSummary {
  const total_invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const total_returns = holdings.reduce((sum, h) => sum + h.returned, 0);
  const active_count = holdings.filter((h) => h.status !== "COMPLETED").length;

  const weighted =
    total_invested === 0
      ? 0
      : holdings.reduce((sum, h) => sum + h.expected_roi_pct * h.invested, 0) /
        total_invested;

  return {
    total_invested,
    active_count,
    total_returns,
    // One decimal: the underlying rates carry one, so rounding to whole
    // percent would make a 14.5% portfolio read as 15%.
    weighted_roi_pct: Math.round(weighted * 10) / 10,
  };
}
