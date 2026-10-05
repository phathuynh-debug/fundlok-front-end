import { describe, it, expect } from "vitest";

import {
  indicativeFigures,
  MAX_COVERAGE,
  RATE_CEILING_PCT,
  REFERENCE_RATE_PCT,
} from "./indicative-figures";
import { ALLOWED_TERM_MONTHS } from "./facility-terms";

// This is the public homepage calculator. The previous model quoted 20.29% at
// the edge of its own accepted range — above the statutory ceiling, on the
// most-viewed page we have. These tests exist so that cannot come back.

describe("indicativeFigures", () => {
  it("never quotes above the statutory ceiling, anywhere in the input space", () => {
    // Sweep the whole reachable slider space rather than a few spot checks:
    // the old bug was reachable only at the far end of it.
    for (const termMonths of ALLOWED_TERM_MONTHS) {
      for (
        let revenue = 100_000_000;
        revenue <= 2_000_000_000;
        revenue += 50_000_000
      ) {
        for (
          let amount = 200_000_000;
          amount <= 1_000_000_000;
          amount += 100_000_000
        ) {
          const { indicativeRate } = indicativeFigures({
            monthlyRevenue: revenue,
            amount,
            termMonths,
          });
          expect(indicativeRate).toBeLessThanOrEqual(RATE_CEILING_PCT);
          expect(indicativeRate).toBeGreaterThanOrEqual(REFERENCE_RATE_PCT);
        }
      }
    }
  });

  it("keeps the business score inside 0-100 across the same space", () => {
    for (const termMonths of ALLOWED_TERM_MONTHS) {
      for (
        let revenue = 100_000_000;
        revenue <= 2_000_000_000;
        revenue += 100_000_000
      ) {
        for (
          let amount = 200_000_000;
          amount <= 1_000_000_000;
          amount += 200_000_000
        ) {
          const { businessScore } = indicativeFigures({
            monthlyRevenue: revenue,
            amount,
            termMonths,
          });
          expect(businessScore).toBeGreaterThanOrEqual(0);
          expect(businessScore).toBeLessThanOrEqual(100);
          expect(Number.isInteger(businessScore)).toBe(true);
        }
      }
    }
  });

  it("prices a stronger score closer to the reference rate", () => {
    const strong = indicativeFigures({
      monthlyRevenue: 2_000_000_000,
      amount: 200_000_000,
      termMonths: 6,
    });
    const weak = indicativeFigures({
      monthlyRevenue: 200_000_000,
      amount: 1_000_000_000,
      termMonths: 6,
    });
    expect(strong.businessScore).toBeGreaterThan(weak.businessScore);
    expect(strong.indicativeRate).toBeLessThan(weak.indicativeRate);
  });

  it("flags a request that outruns the revenue behind it", () => {
    const { isIneligible, coverage } = indicativeFigures({
      monthlyRevenue: 100_000_000,
      amount: 1_000_000_000,
      termMonths: 6,
    });
    expect(coverage).toBeGreaterThan(MAX_COVERAGE);
    expect(isIneligible).toBe(true);
  });

  it("survives a zero-revenue business without emitting NaN", () => {
    const figures = indicativeFigures({
      monthlyRevenue: 0,
      amount: 1_000_000_000,
      termMonths: 6,
    });
    expect(figures.isIneligible).toBe(true);
    expect(figures.businessScore).toBe(0);
    expect(Number.isNaN(figures.indicativeRate)).toBe(false);
    expect(figures.indicativeRate).toBeLessThanOrEqual(RATE_CEILING_PCT);
  });
});
