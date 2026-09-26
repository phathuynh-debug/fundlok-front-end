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
//
// HANDBOOK CONSTRAINTS (fundlok-domain §2, §3) — sample data is still a
// product surface, so these hold here exactly as they do in production:
//   * Score is a 0-100 internal assessment. Never a letter grade: "AAA"/"B+"
//     is rating-agency notation and we are not a rating agency (§4).
//   * Returns are a RANGE, never a bare point figure, and are labelled as
//     targets rather than outcomes (§3).
//   * Terms are 1 to 6 months. Six is the maximum (§2).
//   * Every position carries its backstop date — 1.33x the declared term (§2).
//   * The lifecycle includes the ways a facility goes wrong. A dataset where
//     every position is healthy reads as an implied guarantee (§5), so the
//     watchlist, relief, extension, backstop-settlement and write-down states
//     are all represented below — including one position that returns less
//     than its capital, because the investor bears the loss (§1).

import {
  backstopDate,
  BACKSTOP_MULTIPLIER,
  type TermMonths,
} from "@/lib/facility-terms";

// Re-exported so the screens and tests that already read a holding can reach
// the facility rules without a second import path.
export { backstopDate, BACKSTOP_MULTIPLIER };
export type { TermMonths };

/** Where a position sits in the facility lifecycle (fundlok-domain §9). */
export type HoldingStatus =
  /** Listing still filling; capital committed but not yet disbursed. */
  | "FUNDING"
  /** Disbursed, inside the grace period before daily repayment starts. */
  | "ACTIVE"
  /** Receiving daily repayments on schedule. */
  | "REPAYING"
  /** A missed business day raised a warning. Not a default — it moves the
   *  facility to a watchlist so the conversation happens on day one. */
  | "WATCHLIST"
  /** Verified revenue fell short, so the daily amount for that period dropped
   *  and the term stretches to make it up. Interest on the extra time raises
   *  the total repayable. */
  | "RELIEF"
  /** Past the declared term with a balance outstanding: extended with a fee
   *  set so the annualised cost stays what it was at signing. */
  | "EXTENDED"
  /** Total repayable cleared. */
  | "REPAID"
  /** Cleared ahead of the declared term. No prepayment penalty — and no
   *  discount either: settling early clears the total, it does not reduce it. */
  | "REPAID_EARLY"
  /** Reached the 1.33x backstop; everything outstanding fell due in full and
   *  was settled. */
  | "SETTLED_AT_BACKSTOP"
  /** The business could not repay. The investor bears this loss. */
  | "WRITTEN_DOWN";

/** The four ways a facility ends (§2). Everything else is still running. */
const CLOSED_STATUSES: readonly HoldingStatus[] = [
  "REPAID",
  "REPAID_EARLY",
  "SETTLED_AT_BACKSTOP",
  "WRITTEN_DOWN",
];

export const isClosed = (status: HoldingStatus) =>
  CLOSED_STATUSES.includes(status);

export interface Holding {
  id: string;
  project_name: string;
  /** Canonical engine industry value. */
  industry: string;
  /** Capital committed to this position, VND. */
  invested: number;
  /** Principal + yield received back so far, VND. */
  returned: number;
  /**
   * Target annual return, as a RANGE in percent — never a single figure, and
   * never presented as what the position will pay (§3). The low end is what
   * the position returns if the facility runs to its backstop; the high end
   * assumes it clears on the declared term.
   */
  target_return_pct_min: number;
  target_return_pct_max: number;
  /** Declared term: 1 to 6 months. */
  term_months: TermMonths;
  /** Share of the total repayable already received, 0-100. */
  progress_pct: number;
  /** Next scheduled distribution, or null once the facility has closed. */
  next_payout_date: string | null;
  status: HoldingStatus;
  /** When capital went out, or null while the listing is still filling. */
  disbursed_at: string | null;
  /**
   * 0-100 internal assessment from the last locked score run. A reference
   * input to the investor's own decision, not a credit rating (§2, §4).
   */
  score: number;
}

// Eight positions spanning the whole lifecycle — the healthy path AND the four
// endings, so every status badge is reachable and the screen never implies
// that nothing goes wrong. Ticket sizes sit between 150M and 700M VND —
// plausible against the 20M-5B range in lib/constants/loan-constraints.ts.
export const MOCK_HOLDINGS: Holding[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    project_name: "Mekong Agri Export",
    industry: "Agriculture & Farming",
    invested: 625000000,
    returned: 218750000,
    target_return_pct_min: 13.0,
    target_return_pct_max: 15.5,
    term_months: 6,
    progress_pct: 35,
    next_payout_date: "2026-09-05",
    status: "REPAYING",
    disbursed_at: "2026-07-02",
    score: 82,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    project_name: "TechStart Solutions",
    industry: "IT Services",
    invested: 450000000,
    returned: 46250000,
    target_return_pct_min: 10.5,
    target_return_pct_max: 12.5,
    term_months: 6,
    progress_pct: 10,
    next_payout_date: "2026-09-12",
    // Missed a business day. A warning, not a default (§2).
    status: "WATCHLIST",
    disbursed_at: "2026-08-12",
    score: 74,
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    project_name: "Saigon Coffee Roasters",
    industry: "Food & Beverage",
    invested: 300000000,
    // Half a year at ~15%/yr on 300M -> ~322.5M. Settling early clears the
    // remaining total; it does not reduce it, so this is NOT a full year of
    // yield compressed into six months.
    returned: 322500000,
    target_return_pct_min: 14.0,
    target_return_pct_max: 15.5,
    term_months: 6,
    progress_pct: 100,
    next_payout_date: null,
    status: "REPAID_EARLY",
    disbursed_at: "2026-02-18",
    score: 88,
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    project_name: "Da Nang Boutique Stays",
    industry: "Tourism & Hospitality",
    invested: 700000000,
    returned: 0,
    target_return_pct_min: 12.0,
    target_return_pct_max: 14.0,
    term_months: 6,
    progress_pct: 0,
    next_payout_date: "2026-09-28",
    status: "ACTIVE",
    disbursed_at: "2026-08-28",
    score: 79,
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    project_name: "Hanoi Textile Works",
    industry: "Textile & Garment",
    invested: 380000000,
    returned: 152000000,
    target_return_pct_min: 14.5,
    target_return_pct_max: 16.5,
    term_months: 6,
    progress_pct: 45,
    next_payout_date: "2026-09-08",
    // Revenue fell short over the last true-up, so the daily amount for that
    // period dropped and the term stretches to make it up. Interest on the
    // extra time raises the total repayable.
    status: "RELIEF",
    disbursed_at: "2026-05-20",
    score: 68,
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    project_name: "Binh Duong Logistics Hub",
    industry: "Logistics & Transport",
    invested: 150000000,
    returned: 0,
    target_return_pct_min: 10.0,
    target_return_pct_max: 12.0,
    term_months: 6,
    progress_pct: 0,
    next_payout_date: null,
    status: "FUNDING",
    disbursed_at: null,
    score: 76,
  },
  {
    id: "10000000-0000-0000-0000-000000000007",
    project_name: "Can Tho Rice Mill",
    industry: "Agriculture & Farming",
    invested: 420000000,
    // Ran past its declared term, extended, then settled what was outstanding
    // at the backstop. Returned above capital but below the target range.
    returned: 441000000,
    target_return_pct_min: 13.5,
    target_return_pct_max: 15.0,
    term_months: 6,
    progress_pct: 100,
    next_payout_date: null,
    status: "SETTLED_AT_BACKSTOP",
    disbursed_at: "2025-11-20",
    score: 61,
  },
  {
    id: "10000000-0000-0000-0000-000000000008",
    project_name: "Hue Craft Furniture",
    industry: "Furniture & Woodwork",
    invested: 260000000,
    // Less than the capital committed. The investor bears this loss (§1) —
    // the dataset says so plainly rather than showing eight healthy rows.
    returned: 148200000,
    target_return_pct_min: 15.0,
    target_return_pct_max: 17.0,
    term_months: 6,
    progress_pct: 57,
    next_payout_date: null,
    status: "WRITTEN_DOWN",
    disbursed_at: "2025-08-14",
    score: 54,
  },
];

export interface PortfolioSummary {
  /** Sum of every position, VND. */
  total_invested: number;
  /** Positions that have not reached one of the four endings. */
  active_count: number;
  /** Principal + yield received across all positions, VND. */
  total_returns: number;
  /**
   * Capital committed to positions that returned less than that capital, VND.
   * Shown rather than netted away: a portfolio view that only ever adds up
   * what came back implies a floor under the capital, and there isn't one.
   */
  capital_written_down: number;
  /**
   * Capital-weighted average TARGET return, as a range in percent. Weighted
   * rather than a plain mean: a 700M position and a 150M one do not contribute
   * equally. Computed across OPEN positions only — a closed facility no longer
   * has a target, and folding a written-down position's target into the
   * average would flatter the number with a return that never arrived.
   */
  weighted_target_min_pct: number;
  weighted_target_max_pct: number;
}

export function summarizePortfolio(holdings: Holding[]): PortfolioSummary {
  const total_invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const total_returns = holdings.reduce((sum, h) => sum + h.returned, 0);
  const open = holdings.filter((h) => !isClosed(h.status));

  const capital_written_down = holdings
    .filter((h) => h.status === "WRITTEN_DOWN")
    .reduce((sum, h) => sum + h.invested, 0);

  const openCapital = open.reduce((sum, h) => sum + h.invested, 0);

  const weight = (pick: (h: Holding) => number) =>
    openCapital === 0
      ? 0
      : // One decimal: the underlying rates carry one, so rounding to whole
        // percent would make a 14.5% portfolio read as 15%.
        Math.round(
          (open.reduce((sum, h) => sum + pick(h) * h.invested, 0) /
            openCapital) *
            10,
        ) / 10;

  return {
    total_invested,
    active_count: open.length,
    total_returns,
    capital_written_down,
    weighted_target_min_pct: weight((h) => h.target_return_pct_min),
    weighted_target_max_pct: weight((h) => h.target_return_pct_max),
  };
}
