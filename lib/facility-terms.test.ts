import { describe, it, expect } from "vitest";

import {
  BUSINESS_DAYS_PER_PERIOD,
  dailyRepaymentAmount,
} from "./facility-terms";

describe("dailyRepaymentAmount", () => {
  it("matches the worked example in the SME funding mock", () => {
    // 875,000,000 at 14.5%/yr over 6 months -> 938,437,500 / 126.
    expect(dailyRepaymentAmount(875_000_000, 14.5, 6)).toBe(7_447_917);
  });

  it("spreads the fixed total evenly across every business day", () => {
    const daily = dailyRepaymentAmount(1_000_000_000, 12, 12);
    const days = 12 * BUSINESS_DAYS_PER_PERIOD;
    // Whole VND, so the collected total is within one dong per day of the
    // contract total (1,120,000,000).
    expect(Math.abs(daily * days - 1_120_000_000)).toBeLessThanOrEqual(days);
  });
});
