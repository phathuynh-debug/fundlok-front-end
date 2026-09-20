/**
 * The figures the SME types on steps 2 and 3, replacing the document uploads
 * that used to stand in for them.
 *
 * Why typed instead of uploaded: the documents those steps asked for are the
 * highest-friction thing in the whole flow — 48 files for VAT alone — and
 * `docs/specs/underwriting/grading-input-sources.md` §3.1 records that every
 * field they were meant to supply (#7 `monthly_revenue`, #8 `cogs_y1`,
 * #19 `cic_score`) is still marked **Unparsed**. So today they cost the
 * applicant everything and give the grading engine nothing. Two of the engine's
 * required inputs — #9 `fixed_cost_y1` and #10 `variable_cost_excl_cogs_y1` —
 * are additionally marked "Not stated by any statutory document", so no
 * document could ever supply them; a person has to enter them either way.
 *
 * ⚠️ FIELD LIST IS PROVISIONAL. The Lite spec calls for 6 required + 5
 * optional fields. That document was not available when this was written, so
 * the list below is derived from the engine's own contract instead: a field is
 * `required: true` here when `GradingInput` declares it non-`Optional`
 * (`app/underwriting/grading/types.py`), and optional when the engine types it
 * `Optional[...]`. That yields 5 required, not 6 — the sixth is most likely
 * `loan_size_vnd` or `duration_months`, both of which this wizard already has
 * from the project-application form upstream and should not ask for twice.
 *
 * To reconcile with the spec, edit this array only. Everything else (the form,
 * validation, the review list, the submit payload) is generated from it.
 */

export type LiteFigureKey =
  | "revenue_last_12m"
  | "revenue_prior_12m"
  | "revenue_best_month"
  | "revenue_worst_month"
  | "cogs_y1"
  | "fixed_cost_y1"
  | "variable_cost_excl_cogs_y1"
  | "owner_withdrawal_pct"
  | "conc_top1_pct"
  | "conc_top3_pct";

/** How a value is formatted and bounded. VND amounts are whole đồng. */
export type LiteFigureUnit = "vnd" | "pct";

export interface LiteFigureField {
  key: LiteFigureKey;
  /** Wizard step that collects it. */
  step: 2 | 3;
  required: boolean;
  unit: LiteFigureUnit;
  /** i18n key for the field label. */
  labelKey: string;
  /** i18n key for the one-line hint under the input. */
  hintKey: string;
  /** `GradingInput` field this feeds, per grading-input-sources.md §3.1. */
  gradingInput: string;
}

export const LITE_FIGURE_FIELDS: readonly LiteFigureField[] = [
  // --- Step 2: revenue (replaces the 48-file `vat_tax_zip`) ---------------
  {
    key: "revenue_last_12m",
    step: 2,
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenueLast12m",
    hintKey: "dashboard.sme.lite.revenueLast12mHint",
    gradingInput: "monthly_revenue (m13..m24)",
  },
  {
    key: "revenue_prior_12m",
    step: 2,
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenuePrior12m",
    hintKey: "dashboard.sme.lite.revenuePrior12mHint",
    gradingInput: "monthly_revenue (m1..m12)",
  },
  // The engine scores revenue *stability*, which a single annual total cannot
  // express. Best/worst month is a two-field proxy for the shape of the year —
  // far cheaper than typing 24 values, and it keeps the stability factor from
  // reading a flat synthetic series as perfectly stable.
  {
    key: "revenue_best_month",
    step: 2,
    required: false,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenueBestMonth",
    hintKey: "dashboard.sme.lite.revenueBestMonthHint",
    gradingInput: "monthly_revenue (variability)",
  },
  {
    key: "revenue_worst_month",
    step: 2,
    required: false,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenueWorstMonth",
    hintKey: "dashboard.sme.lite.revenueWorstMonthHint",
    gradingInput: "monthly_revenue (variability)",
  },

  // --- Step 3: costs and concentration (replaces `financial_report`) ------
  {
    key: "cogs_y1",
    step: 3,
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.cogsY1",
    hintKey: "dashboard.sme.lite.cogsY1Hint",
    gradingInput: "cogs_y1",
  },
  {
    key: "fixed_cost_y1",
    step: 3,
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.fixedCostY1",
    hintKey: "dashboard.sme.lite.fixedCostY1Hint",
    gradingInput: "fixed_cost_y1",
  },
  {
    key: "variable_cost_excl_cogs_y1",
    step: 3,
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.variableCostY1",
    hintKey: "dashboard.sme.lite.variableCostY1Hint",
    gradingInput: "variable_cost_excl_cogs_y1",
  },
  {
    key: "owner_withdrawal_pct",
    step: 3,
    required: false,
    unit: "pct",
    labelKey: "dashboard.sme.lite.ownerWithdrawal",
    hintKey: "dashboard.sme.lite.ownerWithdrawalHint",
    gradingInput: "owner_withdrawal",
  },
  {
    key: "conc_top1_pct",
    step: 3,
    required: false,
    unit: "pct",
    labelKey: "dashboard.sme.lite.concTop1",
    hintKey: "dashboard.sme.lite.concTop1Hint",
    gradingInput: "conc_top1_pct",
  },
  {
    key: "conc_top3_pct",
    step: 3,
    required: false,
    unit: "pct",
    labelKey: "dashboard.sme.lite.concTop3",
    hintKey: "dashboard.sme.lite.concTop3Hint",
    gradingInput: "conc_top3_pct",
  },
] as const;

/** Steps whose content is typed figures rather than a file upload. */
export const LITE_FIGURE_STEPS: readonly number[] = [2, 3];

export function figureFieldsForStep(step: number): LiteFigureField[] {
  return LITE_FIGURE_FIELDS.filter((f) => f.step === step);
}

export const LITE_FIGURE_KEYS: readonly LiteFigureKey[] =
  LITE_FIGURE_FIELDS.map((f) => f.key);

export const REQUIRED_LITE_FIGURE_KEYS: readonly LiteFigureKey[] =
  LITE_FIGURE_FIELDS.filter((f) => f.required).map((f) => f.key);

/**
 * Percentages are 0–100; VND amounts must be positive and are capped well
 * above any plausible SME turnover so a mistyped extra digit is caught rather
 * than silently grading a company as a conglomerate.
 */
const VND_MAX = 1_000_000_000_000; // 1 trillion đồng

export const PERCENT_MIN = 0;
export const PERCENT_MAX = 100;

/**
 * The two units read a "." completely differently, so nothing here may parse a
 * figure without knowing which one it is holding.
 *
 * In a VND amount the separators are grouping: `4.800.000.000` is four point
 * eight billion đồng, and the dots are noise to be stripped. In a percentage
 * there is nothing to group — the field tops out at 100 — so a "." is a
 * decimal point, and `19.81` is nineteen point eight one percent.
 *
 * Sharing one normaliser between them is what turned a measured concentration
 * of 19.81% into 1981, which `clampPercentInput` then pinned to 100 — the
 * worst possible value for that factor, arrived at silently, from a figure the
 * applicant typed correctly. Concentration comes off an e-invoice export with
 * two decimals, so this is not a rounding difference; it is a different
 * number reaching the engine.
 */
const VND_DIGITS = /^\d+$/;
const PERCENT_NUMBER = /^\d+(?:[.,]\d+)?$/;

/** Both separators are accepted: a Vietnamese keyboard writes 19,81. */
const toDecimal = (cleaned: string) => Number(cleaned.replace(",", "."));

const stripSpaces = (raw: string) => raw.replace(/\s/g, "");

const UNIT_BY_KEY = Object.fromEntries(
  LITE_FIGURE_FIELDS.map((field) => [field.key, field.unit]),
) as Record<LiteFigureKey, LiteFigureUnit>;

/** The unit for a key, where only the key is to hand (consistency checks). */
export function unitForKey(key: LiteFigureKey): LiteFigureUnit {
  return UNIT_BY_KEY[key];
}

export type FigureError =
  | "required"
  | "not_a_number"
  | "out_of_range"
  | "worst_exceeds_best"
  | "month_exceeds_year"
  | "top1_exceeds_top3"
  | null;

export function validateFigure(
  field: LiteFigureField,
  raw: string,
): FigureError {
  const trimmed = raw.trim();
  if (!trimmed) return field.required ? "required" : null;
  const cleaned = stripSpaces(trimmed);

  if (field.unit === "pct") {
    if (!PERCENT_NUMBER.test(cleaned)) return "not_a_number";
    const value = toDecimal(cleaned);
    if (!Number.isFinite(value)) return "not_a_number";
    return value > PERCENT_MAX ? "out_of_range" : null;
  }

  // Accept the thousands separators a Vietnamese keyboard produces.
  const digits = cleaned.replace(/[.,]/g, "");
  if (!VND_DIGITS.test(digits)) return "not_a_number";

  const value = Number(digits);
  if (!Number.isFinite(value)) return "not_a_number";
  return value <= 0 || value > VND_MAX ? "out_of_range" : null;
}

/**
 * Hold a percentage inside 0-100 as it is typed.
 *
 * A share of revenue above 100% describes nothing, and the backend rejects it
 * — but only at Send, several steps later. Clamping at the input turns a
 * late error into an impossible state.
 *
 * Deliberately narrow:
 *   - only `pct` fields; a VND amount has no such ceiling.
 *   - an empty string stays empty. Coercing a blank field to "0" would make
 *     an optional figure look answered, and 0% concentration is a claim, not
 *     a default.
 *   - anything that is not a clean number is returned untouched, so the
 *     existing `not_a_number` error still gets to explain itself rather than
 *     being silently rewritten.
 *   - a decimal is a value, not a violation. This runs on every keystroke, so
 *     it also has to leave a half-typed "19." and a lone "-" alone rather than
 *     rewriting them mid-word.
 */
export function clampPercentInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  const cleaned = stripSpaces(trimmed).replace(",", ".");
  if (!/^-?\d+(?:\.\d*)?$/.test(cleaned)) return raw;

  const value = Number(cleaned.endsWith(".") ? cleaned.slice(0, -1) : cleaned);
  if (!Number.isFinite(value)) return raw;
  if (value > PERCENT_MAX) return String(PERCENT_MAX);
  if (value < PERCENT_MIN) return String(PERCENT_MIN);
  return raw;
}

/**
 * The number behind the typed string, for submitting and for comparing.
 * `null` when blank or unparseable.
 *
 * `unit` is required, not defaulted: a default is how a percentage came to be
 * read with the VND normaliser in the first place, and the failure was silent.
 */
export function parseFigure(raw: string, unit: LiteFigureUnit): number | null {
  const cleaned = stripSpaces(raw.trim());
  if (!cleaned) return null;

  if (unit === "pct") {
    if (!PERCENT_NUMBER.test(cleaned)) return null;
    const value = toDecimal(cleaned);
    return Number.isFinite(value) ? value : null;
  }

  const digits = cleaned.replace(/[.,]/g, "");
  if (!VND_DIGITS.test(digits)) return null;
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

/**
 * The rules that involve more than one figure.
 *
 * Kept as data rather than inline checks so the form, the review step and the
 * tests all read the same list. Each returns the key it should blame — the
 * field the applicant has to change — not merely that something is wrong.
 *
 * Mirrors app/loans/schemas.py exactly. The backend stays authoritative; this
 * only moves the conversation earlier.
 */
export function validateFigureConsistency(
  values: Record<LiteFigureKey, string>,
): Partial<Record<LiteFigureKey, FigureError>> {
  const errors: Partial<Record<LiteFigureKey, FigureError>> = {};
  const n = (key: LiteFigureKey) => parseFigure(values[key], unitForKey(key));

  const best = n("revenue_best_month");
  const worst = n("revenue_worst_month");
  const year = n("revenue_last_12m");
  const top1 = n("conc_top1_pct");
  const top3 = n("conc_top3_pct");

  // A worst month that beats the best month describes no real company.
  if (best !== null && worst !== null && worst > best) {
    errors.revenue_worst_month = "worst_exceeds_best";
  }

  // A single month cannot out-earn the year that contains it.
  if (year !== null) {
    if (best !== null && best > year)
      errors.revenue_best_month = "month_exceeds_year";
    if (worst !== null && worst > year) {
      errors.revenue_worst_month =
        errors.revenue_worst_month ?? "month_exceeds_year";
    }
  }

  // The largest customer is one OF the top three, so its share cannot be
  // larger than theirs combined.
  if (top1 !== null && top3 !== null && top1 > top3) {
    errors.conc_top1_pct = "top1_exceeds_top3";
  }

  return errors;
}
