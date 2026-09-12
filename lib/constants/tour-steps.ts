import type { SelectableRole } from "@/services/authentication.service";

/**
 * The first-run walkthrough, per role.
 *
 * SMEs and investors do not use the same product, so they do not get the same
 * tour: an SME's first job is to get an application in, an investor's is to
 * understand what a listing is actually telling them. Least-privilege by role
 * (fundlok-domain §9) applies to guidance as much as to data — never show an
 * investor the SME path "for context".
 *
 * `target` is a CSS selector resolved against the live DOM when the tour
 * starts. Steps whose target is not on the page are dropped rather than
 * pointing at nothing: the sidebar is `hidden md:flex`, and the SME "apply"
 * button only exists while the SME has no project yet.
 */
export interface TourStep {
  /** Stable id, and the i18n key suffix under `dashboard.tour.steps`. */
  id: string;
  /** CSS selector for the element to spotlight. */
  target: string;
}

const SHARED_TAIL: readonly TourStep[] = [
  { id: "transactions", target: '[data-tour="nav-transactions"]' },
  { id: "analytics", target: '[data-tour="nav-analytics"]' },
  { id: "security", target: '[data-tour="nav-security"]' },
];

export const SME_TOUR_STEPS: readonly TourStep[] = [
  { id: "smeOverview", target: '[data-tour="nav-overview"]' },
  // Only present before the first application exists — which is exactly when
  // an SME needs pointing at it.
  { id: "smeApply", target: '[data-tour="sme-apply"]' },
  ...SHARED_TAIL,
];

export const INVESTOR_TOUR_STEPS: readonly TourStep[] = [
  { id: "investorOverview", target: '[data-tour="nav-overview"]' },
  { id: "investorProjects", target: '[data-tour="nav-projects"]' },
  ...SHARED_TAIL,
];

export function tourStepsForRole(
  role: SelectableRole | null | undefined,
): readonly TourStep[] {
  if (role === "SME") return SME_TOUR_STEPS;
  if (role === "INVESTOR") return INVESTOR_TOUR_STEPS;
  return [];
}

/**
 * One key per role: an investor who later opens an SME account should get the
 * SME walkthrough rather than being treated as already onboarded.
 */
export function tourStorageKey(role: SelectableRole): string {
  return `fundlok.tour.seen.${role.toLowerCase()}`;
}
