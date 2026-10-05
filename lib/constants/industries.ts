/**
 * The industries the grading engine can score.
 *
 * `value` is sent to the backend verbatim and must match a string in
 * `supported_industries` in the backend's
 * `app/underwriting/grading/params/grading_params_v1.yaml` exactly — the
 * grading engine validates against that list and raises on anything else, so a
 * renamed or invented label here means the application cannot be scored at all.
 * The YAML is the source of truth; this file mirrors it.
 *
 * Excluded industries (gambling, alcohol, tobacco, weapons, defence) are
 * deliberately absent: they are a hard reject in the engine, so we don't invite
 * the application in the first place.
 *
 * TODO: serve this list from the backend so the two cannot drift. Until that
 * endpoint exists, any edit to the YAML has to be mirrored here by hand.
 */
export interface IndustryOption {
  /** Exact engine value. Do not translate, do not reword. */
  value: string;
  /** i18n key under `projectApplication.industries`. */
  labelKey: string;
}

export const INDUSTRY_OPTIONS: readonly IndustryOption[] = [
  { value: "Retail Trade", labelKey: "retailTrade" },
  { value: "Electronics Retail", labelKey: "electronicsRetail" },
  { value: "Food & Beverage", labelKey: "foodBeverage" },
  { value: "Tourism & Hospitality", labelKey: "tourismHospitality" },
  { value: "IT Services", labelKey: "itServices" },
  { value: "Professional Services", labelKey: "professionalServices" },
  { value: "Manufacturing", labelKey: "manufacturing" },
  { value: "Textile & Garment", labelKey: "textileGarment" },
  { value: "Construction Materials", labelKey: "constructionMaterials" },
  { value: "Furniture & Woodwork", labelKey: "furnitureWoodwork" },
  { value: "Logistics & Transport", labelKey: "logisticsTransport" },
  { value: "Agriculture & Farming", labelKey: "agricultureFarming" },
  { value: "Healthcare & Pharmacy", labelKey: "healthcarePharmacy" },
  { value: "Beauty & Personal Care", labelKey: "beautyPersonalCare" },
  { value: "Education & Training", labelKey: "educationTraining" },
] as const;

/** Engine values only — useful for validating a submitted industry. */
export const SUPPORTED_INDUSTRY_VALUES: readonly string[] =
  INDUSTRY_OPTIONS.map((option) => option.value);
