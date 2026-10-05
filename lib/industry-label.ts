import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";

/**
 * Display label for an industry value.
 *
 * Industry arrives as data — the grading engine's canonical strings on real
 * projects, older or mock labels elsewhere. Values we have a translation for
 * are localised; anything else passes through unchanged, so a new backend
 * industry shows as itself rather than a raw i18n key.
 */
export function industryLabel(
  industry: string | null | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (!industry) return "";
  const option = INDUSTRY_OPTIONS.find((entry) => entry.value === industry);
  return option
    ? t(`projectApplication.industries.${option.labelKey}`)
    : industry;
}
