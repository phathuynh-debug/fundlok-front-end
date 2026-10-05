import type { SelectableRole } from "@/services/authentication.service";

/**
 * The first-run welcome cutscreen: a full-screen, slide-by-slide explanation
 * of how FundLok works, shown once before the dashboard tour.
 *
 * An SME and an investor use different products, so each gets its own
 * sequence — the same least-privilege-by-role rule the dashboard tour follows.
 * The SME sequence spends four slides on repayment because the fixed daily
 * amount and relief for slow months are what an SME most needs to understand
 * before signing anything.
 *
 * Copy lives in lib/i18n under `welcome.<role>.<id>`; the first and last
 * slides are shared under `welcome.common.<id>`.
 */

export type WelcomeSlideId =
  | "hello"
  | "intro"
  | "assessment"
  | "daily"
  | "relief"
  | "extension"
  | "rules"
  | "disclosure"
  | "riskRate"
  | "journey"
  | "dailyBenefit"
  | "ready";

export interface WelcomeSlide {
  id: WelcomeSlideId;
  /** Number of bullet points under the body (`items.1` … `items.n`). */
  items?: number;
}

const SME_SLIDES: readonly WelcomeSlide[] = [
  { id: "hello" },
  { id: "intro" },
  { id: "assessment" },
  { id: "daily" },
  { id: "relief" },
  { id: "extension" },
  { id: "rules", items: 3 },
  { id: "ready" },
];

const INVESTOR_SLIDES: readonly WelcomeSlide[] = [
  { id: "hello" },
  { id: "disclosure" },
  { id: "riskRate" },
  { id: "journey" },
  { id: "dailyBenefit", items: 3 },
  { id: "ready" },
];

export function welcomeSlidesForRole(
  role: SelectableRole | null,
): readonly WelcomeSlide[] {
  if (role === "SME") return SME_SLIDES;
  if (role === "INVESTOR") return INVESTOR_SLIDES;
  return [];
}

/** Where a slide's copy lives in the i18n files. */
export function welcomeSlideKey(
  role: SelectableRole,
  id: WelcomeSlideId,
): string {
  if (id === "hello" || id === "ready") return `welcome.common.${id}`;
  return `welcome.${role === "SME" ? "sme" : "investor"}.${id}`;
}
