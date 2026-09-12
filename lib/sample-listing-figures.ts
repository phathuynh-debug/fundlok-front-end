/**
 * Deterministic sample figures for marketplace listings.
 *
 * `GET /projects/public` returns the company, industry, asking amount and
 * purpose — and nothing else. There is no score column in the backend schema,
 * no funding progress, no investor count. The marketplace has always filled
 * those in from a hash of the project id so the demo listings look alive.
 *
 * Two rules for anything that lives here:
 *
 *   1. It is a 0-100 business score, never a letter. "AAA"/"AA"/"A+" is
 *      rating-agency notation and we are not a rating agency
 *      (fundlok-domain §4). The previous expression was `hash % 3`, so every
 *      listing on the marketplace wore one of three top-tier ratings — a
 *      blanket quality claim on top of the notation problem.
 *   2. Every screen that shows it derives it from HERE. The card and the
 *      details page behind it must not disagree about the same project, and
 *      the notice on each screen must say these figures are illustrative.
 *
 * When the scoring engine's output reaches the listing API, delete this and
 * read the real score.
 */

/** Stable 31-bit hash of a listing identity. */
export function listingHash(seed: string | null | undefined): number {
  return Math.abs(
    (seed || "deal")
      .split("")
      .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0),
  );
}

/**
 * A 0-100 business score for a sample listing. The range deliberately spans
 * weak to strong: a marketplace where every listing scores in the 80s reads as
 * a quality guarantee we do not give.
 */
export function sampleListingScore(seed: string | null | undefined): number {
  return (listingHash(seed) % 41) + 52; // 52 - 92
}
