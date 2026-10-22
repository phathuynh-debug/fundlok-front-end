import { describe, it, expect } from "vitest";

import { ALLOWED_TERM_MONTHS } from "@/lib/facility-terms";

import {
  backstopDate,
  BACKSTOP_MULTIPLIER,
  isClosed,
  MOCK_HOLDINGS,
  summarizePortfolio,
  type Holding,
} from "./mock-investor-dashboard";

// summarizePortfolio is the only logic on the investor dashboard, and it is the
// piece that survives the move to a real portfolio API — so it is what's worth
// pinning down here.
//
// The MOCK_HOLDINGS block at the bottom goes further and asserts the
// fundlok-domain invariants directly. Sample data drifts: someone adds a
// plausible-looking position with a 9-month term or an "AA" grade and nothing
// catches it until a screenshot is already in a deck. These tests catch it.

const holding = (overrides: Partial<Holding> = {}): Holding => ({
  id: "x",
  project_name: "Test Co",
  industry: "IT Services",
  invested: 100_000_000,
  returned: 0,
  target_return_pct_min: 11,
  target_return_pct_max: 13,
  term_months: 6,
  progress_pct: 0,
  next_payout_date: null,
  status: "ACTIVE",
  disbursed_at: "2026-01-15",
  score: 75,
  ...overrides,
});

describe("summarizePortfolio", () => {
  it("sums invested and returned across positions", () => {
    const summary = summarizePortfolio([
      holding({ invested: 200_000_000, returned: 50_000_000 }),
      holding({ invested: 300_000_000, returned: 25_000_000 }),
    ]);
    expect(summary.total_invested).toBe(500_000_000);
    expect(summary.total_returns).toBe(75_000_000);
  });

  it("counts only positions that have not reached an ending as active", () => {
    const summary = summarizePortfolio([
      holding({ status: "FUNDING" }),
      holding({ status: "REPAYING" }),
      holding({ status: "WATCHLIST" }),
      holding({ status: "RELIEF" }),
      holding({ status: "EXTENDED" }),
      holding({ status: "REPAID" }),
      holding({ status: "REPAID_EARLY" }),
      holding({ status: "SETTLED_AT_BACKSTOP" }),
      holding({ status: "WRITTEN_DOWN" }),
    ]);
    // The four endings are closed; watchlist, relief and extension are still
    // running facilities and must keep counting as active.
    expect(summary.active_count).toBe(5);
  });

  it("weights the target range by capital, not by position count", () => {
    // A plain mean would give 15%. The 300M at 10% dominates the 100M at 30%,
    // so the real portfolio target is 15% only if you ignore size.
    const summary = summarizePortfolio([
      holding({
        invested: 300_000_000,
        target_return_pct_min: 10,
        target_return_pct_max: 12,
      }),
      holding({
        invested: 100_000_000,
        target_return_pct_min: 30,
        target_return_pct_max: 36,
      }),
    ]);
    expect(summary.weighted_target_min_pct).toBe(15);
    expect(summary.weighted_target_max_pct).toBe(18);
  });

  it("excludes closed positions from the target average", () => {
    // A written-down position never paid its target. Folding it into the
    // average would flatter the figure with a return that did not arrive.
    const summary = summarizePortfolio([
      holding({ invested: 100_000_000, target_return_pct_min: 10 }),
      holding({
        invested: 100_000_000,
        target_return_pct_min: 30,
        status: "WRITTEN_DOWN",
      }),
    ]);
    expect(summary.weighted_target_min_pct).toBe(10);
  });

  it("reports capital written down rather than netting it away", () => {
    const summary = summarizePortfolio([
      holding({ invested: 100_000_000, returned: 40_000_000 }),
      holding({
        invested: 250_000_000,
        returned: 90_000_000,
        status: "WRITTEN_DOWN",
      }),
    ]);
    expect(summary.capital_written_down).toBe(250_000_000);
  });

  it("keeps one decimal of yield rather than rounding to whole percent", () => {
    const summary = summarizePortfolio([
      holding({ invested: 100_000_000, target_return_pct_min: 14.5 }),
    ]);
    expect(summary.weighted_target_min_pct).toBe(14.5);
  });

  it("does not divide by zero on an empty portfolio", () => {
    expect(summarizePortfolio([])).toEqual({
      total_invested: 0,
      active_count: 0,
      total_returns: 0,
      capital_written_down: 0,
      weighted_target_min_pct: 0,
      weighted_target_max_pct: 0,
    });
  });

  it("does not divide by zero when every position is worth nothing", () => {
    const summary = summarizePortfolio([
      holding({ invested: 0, target_return_pct_min: 12 }),
    ]);
    expect(summary.weighted_target_min_pct).toBe(0);
  });
});

describe("backstopDate", () => {
  it("lands at 1.33x the declared term", () => {
    expect(BACKSTOP_MULTIPLIER).toBe(1.33);
    // 3 -> round(3.99) = 4 months; 6 -> round(7.98) = 8 months.
    expect(backstopDate("2026-01-15", 3)).toBe("2026-05-15");
    expect(backstopDate("2026-01-15", 6)).toBe("2026-09-15");
  });
});

describe("MOCK_HOLDINGS", () => {
  it("uses canonical engine industry values so themes and labels resolve", async () => {
    // A made-up industry string renders an untinted card and an untranslated
    // label in Vietnamese, which is exactly the bug this catches.
    const { SUPPORTED_INDUSTRY_VALUES } =
      await import("@/lib/constants/industries");
    for (const held of MOCK_HOLDINGS) {
      expect(SUPPORTED_INDUSTRY_VALUES).toContain(held.industry);
    }
  });

  it("only ever declares a term of 1 to 6 months", () => {
    // Six is the maximum and we never write longer.
    for (const held of MOCK_HOLDINGS) {
      expect(ALLOWED_TERM_MONTHS as readonly number[]).toContain(
        held.term_months,
      );
    }
  });

  it("scores every position 0-100 rather than lettering it", () => {
    // Handbook §2/§4: a 0-100 reference input, never a rating-agency grade.
    for (const held of MOCK_HOLDINGS) {
      expect(typeof held.score).toBe("number");
      expect(held.score).toBeGreaterThanOrEqual(0);
      expect(held.score).toBeLessThanOrEqual(100);
    }
  });

  it("expresses every return as a range, never a single figure", () => {
    // Handbook §3: a bare point figure reads as the outcome.
    for (const held of MOCK_HOLDINGS) {
      expect(held.target_return_pct_max).toBeGreaterThan(
        held.target_return_pct_min,
      );
    }
  });

  it("shows the ways a facility goes wrong, not just the healthy path", () => {
    // A dataset of uniformly healthy positions implies a floor under the
    // capital that the product does not offer (§5).
    const statuses = new Set(MOCK_HOLDINGS.map((h) => h.status));
    expect(statuses).toContain("WATCHLIST");
    expect(statuses).toContain("RELIEF");
    expect(statuses).toContain("WRITTEN_DOWN");
    expect(statuses).toContain("SETTLED_AT_BACKSTOP");
  });

  it("includes a position that returned less than its capital", () => {
    // The investor bears the loss (§1), so the sample data has to contain one.
    const losses = MOCK_HOLDINGS.filter((h) => h.returned < h.invested);
    expect(losses.some((h) => h.status === "WRITTEN_DOWN")).toBe(true);
  });

  it("keeps closed positions free of a next payout date", () => {
    for (const held of MOCK_HOLDINGS) {
      if (isClosed(held.status)) {
        expect(held.next_payout_date).toBeNull();
      }
    }
  });

  it("never shows a position as returning money it made no progress on", () => {
    // Sanity check on the sample data itself: a position that has returned
    // money must have made repayment progress, or the two panels contradict
    // each other on screen.
    for (const held of MOCK_HOLDINGS) {
      if (held.returned > 0) expect(held.progress_pct).toBeGreaterThan(0);
      if (held.progress_pct === 0) expect(held.returned).toBe(0);
    }
  });
});
