/**
 * The invariants of a FundLok facility, in one place.
 *
 * These are product rules from the FundLok Handbook (see the `fundlok-domain`
 * skill), not presentation details and not sample data. They live in `lib/` so
 * the mocks, the screens that render them and the tests all read the same
 * numbers — and so that when the backend starts returning real facilities,
 * these constants are what the responses get checked against rather than being
 * re-typed per screen.
 */

/** The only terms an SME may declare. Twelve months is the maximum (§2). */
export const ALLOWED_TERM_MONTHS = [6, 12] as const;
export type TermMonths = (typeof ALLOWED_TERM_MONTHS)[number];

/**
 * The statutory ceiling on the quoted annual rate (§2). The quoted rate is
 * all-in: there is no second rate underneath it.
 */
export const RATE_CEILING_PCT = 20;

/**
 * Business days in one true-up period — a working month. Repayment is a fixed
 * amount on each of these days, not a monthly instalment.
 */
export const BUSINESS_DAYS_PER_PERIOD = 21;

/**
 * The fixed amount collected each business day, in whole VND: the total
 * repayable (principal plus simple annual interest over the term, fixed at
 * signing) spread evenly across every business day in the term.
 *
 * 875,000,000 at 14.5%/yr over 6 months -> 938,437,500 / 126 = 7,447,917.
 */
export function dailyRepaymentAmount(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): number {
  const totalRepayable =
    principal * (1 + (annualRatePct / 100) * (termMonths / 12));
  return Math.round(totalRepayable / (termMonths * BUSINESS_DAYS_PER_PERIOD));
}

/**
 * The hard deadline sits at 1.33x the declared term, and everything still
 * outstanding falls due in full on that date. The SME knows it from the day
 * they sign and it is disclosed on every listing — so it is derived from the
 * contract, never chosen per screen.
 *
 * 6 months -> ~8 months. 12 months -> ~16 months.
 */
export const BACKSTOP_MULTIPLIER = 1.33;

export function backstopDate(disbursedAt: string, term: TermMonths): string {
  const date = new Date(`${disbursedAt}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + Math.round(term * BACKSTOP_MULTIPLIER));
  return date.toISOString().slice(0, 10);
}
