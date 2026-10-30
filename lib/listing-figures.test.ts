import { describe, it, expect } from "vitest";
import type { FundingWindow } from "@/services/funding.service";
import {
  INVESTOR_TARGET_RETURN_PCT,
  targetReturnVnd,
  ticketBounds,
} from "./listing-figures";

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

describe("ticketBounds", () => {
  const fundingWindow = (capacity: number) =>
    ({ min_ticket_vnd: 10_000_000, capacity_vnd: capacity }) as FundingWindow;

  it("runs from the minimum ticket to what is still open", () => {
    expect(ticketBounds(fundingWindow(60_000_000))).toEqual({
      min: 10_000_000,
      max: 60_000_000,
    });
  });

  it("lets the last ticket take what is left when that is below the minimum", () => {
    expect(ticketBounds(fundingWindow(4_000_000))).toEqual({
      min: 4_000_000,
      max: 4_000_000,
    });
  });
});
