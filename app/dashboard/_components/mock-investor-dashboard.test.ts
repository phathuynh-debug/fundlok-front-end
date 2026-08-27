import { describe, it, expect } from "vitest";

import {
  MOCK_HOLDINGS,
  summarizePortfolio,
  type Holding,
} from "./mock-investor-dashboard";

// summarizePortfolio is the only logic on the investor dashboard, and it is the
// piece that survives the move to a real portfolio API — so it is what's worth
// pinning down here.

const holding = (overrides: Partial<Holding> = {}): Holding => ({
  id: "x",
  project_name: "Test Co",
  industry: "IT Services",
  invested: 100_000_000,
  returned: 0,
  expected_roi_pct: 12,
  term_months: 12,
  progress_pct: 0,
  next_payout_date: null,
  status: "ACTIVE",
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

  it("counts every position that is not COMPLETED as active", () => {
    const summary = summarizePortfolio([
      holding({ status: "FUNDING" }),
      holding({ status: "ACTIVE" }),
      holding({ status: "REPAYING" }),
      holding({ status: "COMPLETED" }),
    ]);
    expect(summary.active_count).toBe(3);
  });

  it("weights yield by capital, not by position count", () => {
    // A plain mean would give 15%. The 300M at 10% dominates the 100M at 30%,
    // so the real portfolio yield is 15% only if you ignore size.
    const summary = summarizePortfolio([
      holding({ invested: 300_000_000, expected_roi_pct: 10 }),
      holding({ invested: 100_000_000, expected_roi_pct: 30 }),
    ]);
    expect(summary.weighted_roi_pct).toBe(15);

    // Flip the weights and the answer has to move.
    const flipped = summarizePortfolio([
      holding({ invested: 100_000_000, expected_roi_pct: 10 }),
      holding({ invested: 300_000_000, expected_roi_pct: 30 }),
    ]);
    expect(flipped.weighted_roi_pct).toBe(25);
  });

  it("keeps one decimal of yield rather than rounding to whole percent", () => {
    const summary = summarizePortfolio([
      holding({ invested: 100_000_000, expected_roi_pct: 14.5 }),
    ]);
    expect(summary.weighted_roi_pct).toBe(14.5);
  });

  it("does not divide by zero on an empty portfolio", () => {
    expect(summarizePortfolio([])).toEqual({
      total_invested: 0,
      active_count: 0,
      total_returns: 0,
      weighted_roi_pct: 0,
    });
  });

  it("does not divide by zero when every position is worth nothing", () => {
    const summary = summarizePortfolio([
      holding({ invested: 0, expected_roi_pct: 12 }),
    ]);
    expect(summary.weighted_roi_pct).toBe(0);
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

  it("keeps COMPLETED positions free of a next payout date", () => {
    for (const held of MOCK_HOLDINGS) {
      if (held.status === "COMPLETED") {
        expect(held.next_payout_date).toBeNull();
        expect(held.progress_pct).toBe(100);
      }
    }
  });

  it("never shows a position as returning more than a completed loan would", () => {
    // Sanity check on the sample data itself: a position that has returned
    // money must have made repayment progress, or the two panels contradict
    // each other on screen.
    for (const held of MOCK_HOLDINGS) {
      if (held.returned > 0) expect(held.progress_pct).toBeGreaterThan(0);
      if (held.progress_pct === 0) expect(held.returned).toBe(0);
    }
  });
});
