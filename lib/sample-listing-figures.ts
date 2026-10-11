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

export interface DealTerms {
  askingAmount: number;
  durationMonths: number;
  interestRatePct: number;
  revenueShareRate: string;
}

/**
 * Deterministic benchmark deal terms when underwriting fields
 * (duration_months, interest_rate_pct) are pending from backend.
 * Uses the exact same seed formula so card and details views never disagree.
 */
export function sampleListingDealTerms(
  project?: {
    id?: string | null;
    legal_name?: string | null;
    loan_application?: {
      requested_amount?: string | number | null;
      duration_months?: number | null;
      interest_rate_pct?: number | null;
      purpose?: string | null;
    } | null;
  } | null,
  index: number = 0,
): DealTerms {
  const seed = project
    ? `${project.id || "deal"}-${project.legal_name || "deal"}-${index}`
    : `deal-${index}`;
  const hash = listingHash(seed);

  const rawAmount = project?.loan_application?.requested_amount;
  const askingAmount =
    rawAmount !== undefined && rawAmount !== null
      ? Number(rawAmount)
      : 500_000_000;

  // Benchmark durations: 12, 9, 6, 12, 18 months
  const benchmarkDurations = [12, 9, 6, 12, 18];
  const durationMonths =
    project?.loan_application?.duration_months ??
    benchmarkDurations[hash % benchmarkDurations.length];

  // Benchmark rates: 14.2, 13.5, 15.2, 12.8, 14.8, 13.9%
  const benchmarkRates = [14.2, 13.5, 15.2, 12.8, 14.8, 13.9];
  const interestRatePct =
    project?.loan_application?.interest_rate_pct ??
    benchmarkRates[hash % benchmarkRates.length];

  // Benchmark revenue share rates
  const benchmarkRevShares = ["8.0%", "8.5%", "7.5%", "9.0%", "8.2%"];
  const revenueShareRate = benchmarkRevShares[hash % benchmarkRevShares.length];

  return {
    askingAmount,
    durationMonths,
    interestRatePct,
    revenueShareRate,
  };
}
