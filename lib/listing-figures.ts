import type { FundingWindow } from "@/services/funding.service";
import type { MarketplaceListing } from "@/services/projects.service";

/**
 * Figures derived from a real listing (GET /projects/public), shared by the
 * marketplace card and the project page so the two always agree.
 */

/** Whole percent funded, 0-100. */
export function listingFundedPercent(listing: MarketplaceListing): number {
  if (listing.target_amount <= 0) return 0;
  return Math.min(
    100,
    Math.floor((listing.funded_amount / listing.target_amount) * 100),
  );
}

/** VND still open for investment, never below zero. */
export function listingRemaining(listing: MarketplaceListing): number {
  return Math.max(0, listing.target_amount - listing.funded_amount);
}

/** Whole days until the listing closes, or null when it has no closing date. */
export function listingDaysLeft(
  listing: MarketplaceListing,
  now: Date = new Date(),
): number | null {
  if (!listing.close_at) return null;
  const ms = new Date(listing.close_at).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * The investor's target return, as a share of what they put in: 2.5% for the
 * whole loan, flat, whatever its term (Phat, 2026-10-29). Not a yearly rate,
 * and not FundLok's bank reference rate, which is never shown publicly
 * (docs/specs/rates/investor-rate-calculator.md).
 */
export const INVESTOR_TARGET_RETURN_PCT = 2.5;

/**
 * The target return in VND on the business's whole request: what investing
 * the full asking amount would return, at INVESTOR_TARGET_RETURN_PCT. A
 * target, never a promise; the caller shows that beside it.
 */
export function targetReturnVnd(amountVnd: number): number {
  return Math.round((amountVnd * INVESTOR_TARGET_RETURN_PCT) / 100);
}

/**
 * The smallest and largest amount one ticket can take on a funding window:
 * its minimum ticket up to what is still open. The last ticket may be below
 * the minimum when it takes exactly what is left (funding-window.md I-6); the
 * backend has the final say.
 */
export function ticketBounds(fundingWindow: FundingWindow): {
  min: number;
  max: number;
} {
  const max = fundingWindow.capacity_vnd;
  const min =
    max < fundingWindow.min_ticket_vnd ? max : fundingWindow.min_ticket_vnd;
  return { min, max };
}
