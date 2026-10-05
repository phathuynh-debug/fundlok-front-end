/**
 * The figures on step 2 (revenue and costs).
 *
 * None of them is typed. Each is read out of one of the two files that step
 * takes, or worked out from both, and is shown read-only: the applicant cannot
 * type over a number the files state, and cannot supply one they do not. A
 * figure the files cannot state stays blank, and while a required one is blank
 * the step stays blocked until the files are replaced (see figures-from-files).
 *
 * Why files and not typing: a typed number can simply be wrong, and the signed
 * originals cannot. It is also what the documents these figures used to be
 * asked for as (48 VAT files, a financial report) were for, without the
 * friction — `docs/specs/underwriting/grading-input-sources.md` §3.1.
 *
 * Fixed and variable cost are the one place a RULE stands in for a fact. No
 * filing labels a cost fixed or variable, so the backend's statement parser
 * (`app/uploads/parsers/statements.py`) applies one: fixed cost is the
 * management expense (B02 line 24 on a TT133 statement, line 26 on TT200) plus
 * the financial expense (line 22, interest included), and variable cost is the
 * selling expense (line 25). A TT133 statement has no line 25, so its variable
 * cost is 0. The backend applies the same rule when it grades, so what is shown
 * here is what is graded.
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

/** The two blocks step 2 is laid out in. */
export type FigureGroup = "revenue" | "costs";

/**
 * Where a figure is read from. Every figure has exactly one place, and `read`
 * names the property of that file's preview that states it, so the mapping is
 * type-checked against what the backend sends.
 */
export type FigureSource =
  | {
      from: "invoices";
      read:
        | "revenue_last_12m"
        | "revenue_best_month"
        | "revenue_worst_month"
        | "conc_top1_pct"
        | "conc_top3_pct";
    }
  | {
      from: "statements";
      read:
        | "cogs_y1"
        | "fixed_cost_y1"
        | "variable_cost_excl_cogs_y1"
        | "owner_withdrawal_pct";
    }
  // Neither file states it: it is the VAT declarations' months that fall in the
  // 12 before the invoices (see prior-year-revenue.ts), so it needs both.
  | { from: "vat" };

export interface LiteFigureField {
  key: LiteFigureKey;
  /** Wizard step that collects it: revenue and costs share step 2. */
  step: 2;
  /** Which block of the step it sits in. */
  group: FigureGroup;
  required: boolean;
  unit: LiteFigureUnit;
  /** i18n key for the field label. */
  labelKey: string;
  /** i18n key for the one-line hint under the input. */
  hintKey: string;
  /** `GradingInput` field this feeds, per grading-input-sources.md §3.1. */
  gradingInput: string;
  /** A VND amount where 0 is a real answer (no such cost), not a slip. */
  allowZero?: boolean;
  /** The file, and the property in it, this figure is read from. */
  source: FigureSource;
  /** i18n key for the note under a value, saying where it came from. */
  sourceNoteKey: string;
  /**
   * Shown instead of `sourceNoteKey` when the file states 0. For a cost, 0
   * means none was booked: an answer, but one that reads like missing data.
   */
  zeroNoteKey?: string;
}

export const LITE_FIGURE_FIELDS: readonly LiteFigureField[] = [
  // --- Revenue (replaces the 48-file `vat_tax_zip`) -----------------------
  {
    key: "revenue_last_12m",
    step: 2,
    group: "revenue",
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenueLast12m",
    hintKey: "dashboard.sme.lite.revenueLast12mHint",
    gradingInput: "monthly_revenue (m13..m24)",
    source: { from: "invoices", read: "revenue_last_12m" },
    sourceNoteKey: "dashboard.sme.figureFromInvoices",
  },
  {
    key: "revenue_prior_12m",
    step: 2,
    group: "revenue",
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenuePrior12m",
    hintKey: "dashboard.sme.lite.revenuePrior12mHint",
    gradingInput: "monthly_revenue (m1..m12)",
    source: { from: "vat" },
    sourceNoteKey: "dashboard.sme.figureFromVat",
  },
  // The engine scores revenue *stability*, which a single annual total cannot
  // express. Best/worst month is a two-field proxy for the shape of the year,
  // read off the invoices' monthly totals, and it keeps the stability factor
  // from reading a flat synthetic series as perfectly stable.
  {
    key: "revenue_best_month",
    step: 2,
    group: "revenue",
    required: false,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenueBestMonth",
    hintKey: "dashboard.sme.lite.revenueBestMonthHint",
    gradingInput: "monthly_revenue (variability)",
    source: { from: "invoices", read: "revenue_best_month" },
    sourceNoteKey: "dashboard.sme.figureFromInvoices",
  },
  {
    key: "revenue_worst_month",
    step: 2,
    group: "revenue",
    required: false,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.revenueWorstMonth",
    hintKey: "dashboard.sme.lite.revenueWorstMonthHint",
    gradingInput: "monthly_revenue (variability)",
    source: { from: "invoices", read: "revenue_worst_month" },
    sourceNoteKey: "dashboard.sme.figureFromInvoices",
  },

  // --- Costs and concentration (replaces `financial_report`) --------------
  {
    key: "cogs_y1",
    step: 2,
    group: "costs",
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.cogsY1",
    hintKey: "dashboard.sme.lite.cogsY1Hint",
    gradingInput: "cogs_y1",
    source: { from: "statements", read: "cogs_y1" },
    sourceNoteKey: "dashboard.sme.figureFromFilings",
  },
  {
    key: "fixed_cost_y1",
    step: 2,
    group: "costs",
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.fixedCostY1",
    hintKey: "dashboard.sme.lite.fixedCostY1Hint",
    gradingInput: "fixed_cost_y1",
    source: { from: "statements", read: "fixed_cost_y1" },
    sourceNoteKey: "dashboard.sme.figureFromFixed",
  },
  {
    key: "variable_cost_excl_cogs_y1",
    step: 2,
    group: "costs",
    required: true,
    unit: "vnd",
    labelKey: "dashboard.sme.lite.variableCostY1",
    hintKey: "dashboard.sme.lite.variableCostY1Hint",
    gradingInput: "variable_cost_excl_cogs_y1",
    // Many small firms book no selling expense at all; the backend accepts 0.
    allowZero: true,
    source: { from: "statements", read: "variable_cost_excl_cogs_y1" },
    sourceNoteKey: "dashboard.sme.figureFromSelling",
    zeroNoteKey: "dashboard.sme.figureSellingNone",
  },
  {
    key: "owner_withdrawal_pct",
    step: 2,
    group: "costs",
    required: false,
    unit: "pct",
    labelKey: "dashboard.sme.lite.ownerWithdrawal",
    hintKey: "dashboard.sme.lite.ownerWithdrawalHint",
    gradingInput: "owner_withdrawal",
    source: { from: "statements", read: "owner_withdrawal_pct" },
    sourceNoteKey: "dashboard.sme.figureFromFilings",
  },
  {
    key: "conc_top1_pct",
    step: 2,
    group: "costs",
    required: false,
    unit: "pct",
    labelKey: "dashboard.sme.lite.concTop1",
    hintKey: "dashboard.sme.lite.concTop1Hint",
    gradingInput: "conc_top1_pct",
    source: { from: "invoices", read: "conc_top1_pct" },
    sourceNoteKey: "dashboard.sme.figureFromInvoices",
  },
  {
    key: "conc_top3_pct",
    step: 2,
    group: "costs",
    required: false,
    unit: "pct",
    labelKey: "dashboard.sme.lite.concTop3",
    hintKey: "dashboard.sme.lite.concTop3Hint",
    gradingInput: "conc_top3_pct",
    source: { from: "invoices", read: "conc_top3_pct" },
    sourceNoteKey: "dashboard.sme.figureFromInvoices",
  },
] as const;

/** Steps whose content is figures as well as files. */
export const LITE_FIGURE_STEPS: readonly number[] = [2];

export function figureFieldsForStep(step: number): LiteFigureField[] {
  return LITE_FIGURE_FIELDS.filter((f) => f.step === step);
}

export function figureFieldsInGroup(group: FigureGroup): LiteFigureField[] {
  return LITE_FIGURE_FIELDS.filter((f) => f.group === group);
}

export const LITE_FIGURE_KEYS: readonly LiteFigureKey[] =
  LITE_FIGURE_FIELDS.map((f) => f.key);

export const REQUIRED_LITE_FIGURE_KEYS: readonly LiteFigureKey[] =
  LITE_FIGURE_FIELDS.filter((f) => f.required).map((f) => f.key);

/**
 * Percentages are 0–100; VND amounts must be positive (or zero where the
 * field allows it) and are capped well above any plausible SME turnover, so a
 * figure read wrongly is caught rather than silently grading a company as a
 * conglomerate.
 */
const VND_MAX = 1_000_000_000_000; // 1 trillion đồng

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
 * of 19.81% into 1981, which the input's clamp then pinned to 100 — the worst
 * possible value for that factor, arrived at silently, from a figure that was
 * correct. Concentration comes off an e-invoice export with two decimals, so
 * this is not a rounding difference; it is a different number reaching the
 * engine. Nothing is typed any more, but the figures still travel as strings
 * and the two units still read a "." differently.
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
  | "costs_exceed_revenue"
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
  if (value === 0) return field.allowZero ? null : "out_of_range";
  return value < 0 || value > VND_MAX ? "out_of_range" : null;
}

/**
 * The number behind a figure's string, for submitting and for comparing.
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

  // The engine refuses to grade a year that made no profit, so total cost has
  // to stay below revenue. Nothing on this step can be edited, so this is a
  // statement about the files, not a slip to fix; it is shown under fixed cost,
  // the last of the three costs to be read and the one that tips the sum.
  const cogs = n("cogs_y1");
  const fixed = n("fixed_cost_y1");
  const variable = n("variable_cost_excl_cogs_y1");
  if (
    year !== null &&
    cogs !== null &&
    fixed !== null &&
    variable !== null &&
    cogs + fixed + variable >= year
  ) {
    errors.fixed_cost_y1 = "costs_exceed_revenue";
  }

  return errors;
}
