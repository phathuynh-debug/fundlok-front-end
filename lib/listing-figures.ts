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
