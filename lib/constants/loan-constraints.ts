/**
 * Loan shapes the grading engine will accept.
 *
 * Mirrors `loan_constraints` in the backend's
 * `app/underwriting/grading/params/grading_params_v1.yaml`. The engine
 * validates against these before scoring anything and raises on a term or
 * amount outside them, so an application collected outside these bounds cannot
 * be graded at all.
 *
 * Note `duration_months` is the loan TERM — how long until it is repaid. It is
 * a different thing from `repayment_preference` (how often instalments land),
 * which the engine does not read. Both are collected; only the term reaches the
 * engine.
 *
 * TODO: serve these from the backend so they cannot drift from the YAML.
 */

/** The only loan terms the engine accepts, in months. */
export const LOAN_DURATIONS_MONTHS = [3, 6, 9, 12] as const;

export type LoanDurationMonths = (typeof LOAN_DURATIONS_MONTHS)[number];

/** Principal bounds, VND. 200 million to 5 billion. */
export const LOAN_MIN_VND = 200_000_000;
export const LOAN_MAX_VND = 5_000_000_000;

export function isAllowedLoanDuration(
  value: number,
): value is LoanDurationMonths {
  return (LOAN_DURATIONS_MONTHS as readonly number[]).includes(value);
}
