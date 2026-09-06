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

export type FigureError = "required" | "not_a_number" | "out_of_range" | null;

export function validateFigure(
  field: LiteFigureField,
  raw: string,
): FigureError {
  const trimmed = raw.trim();
  if (!trimmed) return field.required ? "required" : null;

  // Accept the thousands separators a Vietnamese keyboard produces.
  const normalized = trimmed.replace(/[.,\s]/g, "");
  if (!/^\d+$/.test(normalized)) return "not_a_number";

  const value = Number(normalized);
  if (!Number.isFinite(value)) return "not_a_number";
  if (field.unit === "pct") return value > 100 ? "out_of_range" : null;
  return value <= 0 || value > VND_MAX ? "out_of_range" : null;
}

/** Digits only, for submitting and for comparing. `null` when left blank. */
export function parseFigure(raw: string): number | null {
  const normalized = raw.trim().replace(/[.,\s]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
