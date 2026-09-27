import { describe, it, expect } from "vitest";

import {
  ALLOWED_TERM_MONTHS,
  BUSINESS_DAYS_PER_PERIOD,
  dailyRepaymentAmount,
  stretchedTerm,
} from "./facility-terms";

describe("dailyRepaymentAmount", () => {
  it("matches the worked example in the SME funding mock", () => {
    // 875,000,000 at 14.5%/yr over 6 months -> 938,437,500 / 126.
    expect(dailyRepaymentAmount(875_000_000, 14.5, 6)).toBe(7_447_917);
  });

  it("spreads the fixed total evenly across every business day", () => {
    const daily = dailyRepaymentAmount(1_000_000_000, 12, 6);
    const days = 6 * BUSINESS_DAYS_PER_PERIOD;
    // Whole VND, so the collected total is within one dong per day of the
    // contract total (1,060,000,000).
    expect(Math.abs(daily * days - 1_060_000_000)).toBeLessThanOrEqual(days);
  });
});

describe("stretchedTerm", () => {
  it("stretches the term and adds interest when revenue drops", () => {
    // The SME funding mock's relief period: 46,996,257 short at 7,447,917/day.
    expect(stretchedTerm(875_000_000, 14.5, 7_447_917, 46_996_257, 6)).toEqual({
      extraBusinessDays: 7,
      extraInterest: 3_524_306,
      cappedAtBackstop: false,
    });
  });

  it("caps the stretch and interest at the 1.33x fixed backstop", () => {
    // Massive shortfall (e.g. 500,000,000) would stretch 68 days without a cap.
    // Over a 6-month term (126 days), the 1.33x backstop (168 days) caps extra days at 42.
    expect(stretchedTerm(875_000_000, 14.5, 7_447_917, 500_000_000, 6)).toEqual(
      {
        extraBusinessDays: 42,
        extraInterest: 21_145_833,
        cappedAtBackstop: true,
      },
    );
  });

  it("adds nothing when nothing fell short", () => {
    expect(stretchedTerm(875_000_000, 14.5, 7_447_917, 0, 6)).toEqual({
      extraBusinessDays: 0,
      extraInterest: 0,
      cappedAtBackstop: false,
    });
  });
});

describe("ALLOWED_TERM_MONTHS", () => {
  it("is 1 to 6 months, and six is the maximum", () => {
    expect(ALLOWED_TERM_MONTHS).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
