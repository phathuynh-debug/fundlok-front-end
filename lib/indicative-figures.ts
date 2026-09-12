import { RATE_CEILING_PCT } from "@/lib/facility-terms";

/**
 * The marketing calculator's ILLUSTRATIVE figures. This is not our pricing
 * model and must never become one.
 *
 * The homepage widget used to run the production sigmoid curve, with its fitted
 * coefficients, in public client-side JavaScript. Two separate problems:
 *
 *   1. It published a pricing input. Handbook §5 forbids showing internal
 *      costs, margins, pricing inputs or projections on an external surface,
 *      and "readable in view-source" is as external as it gets.
 *   2. Its asymptote sat at 43.4%, so at the edge of the accepted range the
 *      panel quoted 20.29% — above the statutory 20%/yr ceiling the rate is
 *      capped at (§2).
 *
 * What is here instead is only the SHAPE the handbook describes: a rate that
 * starts from a reference rate and moves toward the ceiling as the request
 * grows against verified revenue. Linear, clamped at both ends, built from
 * round numbers that could not be mistaken for a fitted model. The real rate
 * is produced server-side by the scoring engine against verified tax records.
 *
 * Lives in `lib/` with a test rather than inline in the component so the
 * ceiling clamp is pinned by something other than a careful reader.
 */

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Where a strong business starts — the unsecured bank reference rate. */
export const REFERENCE_RATE_PCT = 11;

export { RATE_CEILING_PCT };

/** Above this, the request is too large against the revenue behind it. */
export const MAX_COVERAGE = 0.5;

export interface IndicativeInput {
  /** Monthly revenue, VND. */
  monthlyRevenue: number;
  /** Amount requested, VND. */
  amount: number;
  /** Declared term in months. */
  termMonths: number;
}

export interface IndicativeFigures {
  /** Request as a multiple of revenue expected across the term. */
  coverage: number;
  /** The 0-100 business score (§2) — never a ratio shown raw, never a letter. */
  businessScore: number;
  /**
   * Indicative all-in annual rate, percent. Guaranteed to sit within
   * [REFERENCE_RATE_PCT, RATE_CEILING_PCT] for every possible input.
   */
  indicativeRate: number;
  /** The request sits outside the range this product can serve. */
  isIneligible: boolean;
}

export function indicativeFigures({
  monthlyRevenue,
  amount,
  termMonths,
}: IndicativeInput): IndicativeFigures {
  const termRevenue = monthlyRevenue * termMonths;
  // A zero-revenue business cannot be covered at all; treat it as the worst
  // case rather than propagating Infinity or NaN into the score.
  const coverage =
    termRevenue <= 0 ? Number.POSITIVE_INFINITY : amount / termRevenue;

  const businessScore = Number.isFinite(coverage)
    ? Math.round(clamp(100 - coverage * 160, 0, 100))
    : 0;

  const indicativeRate = clamp(
    REFERENCE_RATE_PCT +
      ((100 - businessScore) / 100) * (RATE_CEILING_PCT - REFERENCE_RATE_PCT),
    REFERENCE_RATE_PCT,
    RATE_CEILING_PCT,
  );

  return {
    coverage: Number.isFinite(coverage) ? coverage : 0,
    businessScore,
    indicativeRate,
    isIneligible: !Number.isFinite(coverage) || coverage > MAX_COVERAGE,
  };
}
