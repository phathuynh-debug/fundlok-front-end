import { describe, it, expect } from "vitest";
import type { FundingWindow } from "@/services/funding.service";
import type { MarketplaceListing } from "@/services/projects.service";
import {
  INVESTOR_TARGET_RETURN_PCT,
  lastTicketVnd,
  listingLastTicketVnd,
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

describe("lastTicketVnd", () => {
  it("is what is left when that is below the minimum ticket", () => {
    // 45M asked, 40M taken: one investor can take exactly 5M.
    expect(lastTicketVnd(5_000_000, 10_000_000)).toBe(5_000_000);
  });

  it("is null when a full minimum ticket still fits, or nothing is left", () => {
    expect(lastTicketVnd(10_000_000, 10_000_000)).toBeNull();
    expect(lastTicketVnd(15_000_000, 10_000_000)).toBeNull();
    expect(lastTicketVnd(0, 10_000_000)).toBeNull();
  });
});

describe("listingLastTicketVnd", () => {
  const listing = (over: Partial<MarketplaceListing> = {}) =>
    ({
      id: "l1",
      status: "OPEN",
      target_amount: 45_000_000,
      funded_amount: 40_000_000,
      min_ticket: 10_000_000,
      investor_count: 4,
      open_at: null,
      close_at: null,
      ...over,
    }) as MarketplaceListing;

  it("is what an open listing has left to raise below its minimum", () => {
    expect(listingLastTicketVnd(listing())).toBe(5_000_000);
  });

  it("is null for a closed listing, one with no minimum, or one with room", () => {
    expect(listingLastTicketVnd(listing({ status: "CLOSED" }))).toBeNull();
    expect(listingLastTicketVnd(listing({ min_ticket: null }))).toBeNull();
    expect(
      listingLastTicketVnd(listing({ funded_amount: 30_000_000 })),
    ).toBeNull();
  });
});
