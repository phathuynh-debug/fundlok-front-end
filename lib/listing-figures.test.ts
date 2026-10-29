import { describe, it, expect } from "vitest";
import { INVESTOR_TARGET_RETURN_PCT, targetReturnVnd } from "./listing-figures";

describe("targetReturnVnd", () => {
  it("is 2.5% of the whole request, for the whole loan", () => {
    expect(INVESTOR_TARGET_RETURN_PCT).toBe(2.5);
    // The 50,000,000 request that showed 6,000,000 and then 2,000,000.
    expect(targetReturnVnd(50_000_000)).toBe(1_250_000);
    expect(targetReturnVnd(800_000_000)).toBe(20_000_000);
  });

  it("rounds to a whole dong", () => {
    expect(targetReturnVnd(10_000_001)).toBe(250_000);
  });
});
