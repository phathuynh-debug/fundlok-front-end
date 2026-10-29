import { describe, it, expect } from "vitest";
import { targetReturnVnd } from "./listing-figures";

describe("targetReturnVnd", () => {
  it("pro-rates the yearly rate by the loan's term", () => {
    // The marketplace card that showed 6,000,000: 50,000,000 for 4 months at 12%.
    expect(targetReturnVnd(50_000_000, 12, 4)).toBe(2_000_000);
    expect(targetReturnVnd(800_000_000, 12, 9)).toBe(72_000_000);
  });

  it("is a full year's return only for a 12-month loan", () => {
    expect(targetReturnVnd(50_000_000, 12, 12)).toBe(6_000_000);
  });

  it("rounds to a whole dong", () => {
    expect(targetReturnVnd(10_000_001, 12, 1)).toBe(100_000);
  });
});
