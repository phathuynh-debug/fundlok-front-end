/**
 * Company size bands the grading engine recognises.
 *
 * Mirrors `company_sizes` in the backend's
 * `app/underwriting/grading/params/grading_params_v1.yaml`. The engine takes
 * `company_size` as one of three literals — it does not take a headcount — so
 * we ask the SME for the number it actually knows (how many people it employs)
 * and derive the band from these ranges.
 *
 * A headcount above MAX_EMPLOYEES has no band: the engine's largest bucket
 * stops at 200, which is the SME ceiling this product underwrites. Anything
 * larger has to be rejected at the form rather than guessed into "medium".
 *
 * TODO: serve these from the backend so they cannot drift from the YAML.
 */
export type CompanySize = "micro" | "small" | "medium";

export interface CompanySizeBand {
  /** Exact engine value. */
  size: CompanySize;
  min: number;
  max: number;
  /** i18n key under `projectApplication.companySizes`. */
  labelKey: CompanySize;
}

export const COMPANY_SIZE_BANDS: readonly CompanySizeBand[] = [
  { size: "micro", min: 1, max: 10, labelKey: "micro" },
  { size: "small", min: 11, max: 50, labelKey: "small" },
  { size: "medium", min: 51, max: 200, labelKey: "medium" },
] as const;

export const MIN_EMPLOYEES = COMPANY_SIZE_BANDS[0].min;
export const MAX_EMPLOYEES =
  COMPANY_SIZE_BANDS[COMPANY_SIZE_BANDS.length - 1].max;

/** The band a headcount falls in, or null when it is outside every band. */
export function companySizeForHeadcount(count: number): CompanySize | null {
  if (!Number.isInteger(count)) return null;
  const band = COMPANY_SIZE_BANDS.find(
    (candidate) => count >= candidate.min && count <= candidate.max,
  );
  return band ? band.size : null;
}
