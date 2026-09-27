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

import {
  LOAN_DURATIONS_MONTHS,
  type LoanDurationMonths,
} from "@/lib/constants/loan-constraints";

/**
 * The only terms an SME may declare: 1 to 6 months. Six is the maximum.
 * Re-exported from the engine's loan constraints so the product rule and what
 * the grading engine accepts cannot drift apart.
 */
export const ALLOWED_TERM_MONTHS = LOAN_DURATIONS_MONTHS;
export type TermMonths = LoanDurationMonths;

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

/** Business days in a year: twelve true-up periods. */
export const BUSINESS_DAYS_PER_YEAR = 12 * BUSINESS_DAYS_PER_PERIOD;

/**
 * The fixed amount collected each business day, in whole VND: the total
 * repayable at signing (principal plus simple annual interest over the term)
 * spread evenly across every business day in the term.
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
 * contract, never chosen per screen. A stretched term never moves it.
 *
 * 3 months -> ~4 months. 6 months -> ~8 months.
 */
export const BACKSTOP_MULTIPLIER = 1.33;

/**
 * Maximum extra business days a facility can stretch before hitting the
 * 1.33x backstop deadline. Everything still outstanding falls due in full
 * on that date, and no interest runs past it.
 */
export function maxStretchBusinessDays(termMonths: number): number {
  const backstopMonths = Math.round(termMonths * BACKSTOP_MULTIPLIER);
  return Math.max(0, (backstopMonths - termMonths) * BUSINESS_DAYS_PER_PERIOD);
}

export interface StretchedTermResult {
  extraBusinessDays: number;
  extraInterest: number;
  cappedAtBackstop: boolean;
}

/**
 * THE RULE WHEN REVENUE DROPS: the daily repayment is lowered and the term
 * stretches until the shortfall is repaid. Interest runs on the new, longer
 * term, so the total repayable goes UP — the SME pays less each day, for
 * longer. A strong period never raises the daily amount or the total.
 *
 * Given how much less was collected than the contractual daily amount would
 * have, returns the business days the term stretches by and the extra interest
 * those days carry (simple interest on the principal, at the signing rate).
 *
 * When termMonths is provided, extraBusinessDays is strictly capped at the
 * fixed 1.33x backstop date — interest does not run past the backstop.
 *
 * 46,996,257 short at 7,447,917/day -> 7 extra days; on 875,000,000 at
 * 14.5%/yr that is 875,000,000 x 0.145 x 7 / 252 = 3,524,306.
 */
export function stretchedTerm(
  principal: number,
  annualRatePct: number,
  contractualDailyAmount: number,
  shortfall: number,
  termMonths?: number,
): StretchedTermResult {
  if (shortfall <= 0 || contractualDailyAmount <= 0) {
    return { extraBusinessDays: 0, extraInterest: 0, cappedAtBackstop: false };
  }
  let extraBusinessDays = Math.ceil(shortfall / contractualDailyAmount);
  let cappedAtBackstop = false;

  if (termMonths !== undefined && termMonths > 0) {
    const maxDays = maxStretchBusinessDays(termMonths);
    if (extraBusinessDays > maxDays) {
      extraBusinessDays = maxDays;
      cappedAtBackstop = true;
    }
  }

  const extraInterest = Math.round(
    (principal * (annualRatePct / 100) * extraBusinessDays) /
      BUSINESS_DAYS_PER_YEAR,
  );
  return { extraBusinessDays, extraInterest, cappedAtBackstop };
}

export function backstopDate(disbursedAt: string, term: TermMonths): string {
  const date = new Date(`${disbursedAt}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + Math.round(term * BACKSTOP_MULTIPLIER));
  return date.toISOString().slice(0, 10);
}
