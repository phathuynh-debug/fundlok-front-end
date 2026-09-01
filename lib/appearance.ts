/**
 * Appearance preferences that both the server and the client need to read.
 *
 * Deliberately NOT in components/appearance-provider.tsx: that file is
 * "use client", and a server component may only RENDER a client module's
 * components — calling a function exported from one throws
 * "Attempted to call X() from the server but X is on the client". app/layout.tsx
 * is a server component and needs to read these cookies during SSR, so the
 * plain helpers live here and both sides import them.
 *
 * Every preference here is applied as an attribute on <html> that CSS keys off
 * (see the "Appearance preferences" block in app/globals.css), rather than by
 * injecting inline styles. That keeps the rules in one auditable place and means
 * the server can render the attribute on the first byte — no flash of the wrong
 * theme, no layout shift.
 */

export const REDUCE_MOTION_COOKIE_NAME = "fl_reduce_motion";
export const ACCENT_COOKIE_NAME = "fl_accent";
export const RADIUS_COOKIE_NAME = "fl_radius";

/** Cookie value → boolean. Anything but "1" is off, including absent. */
export function parseReduceMotionCookie(value?: string | null): boolean {
  return value === "1";
}

/**
 * The accent drives `--primary` (and `--ring` / `--sidebar-primary` with it),
 * which is the token the app's CHROME is built on: active sidebar item, primary
 * buttons, section icons, selected states, focus rings.
 *
 * It deliberately does NOT touch the `emerald-*` utilities used across 59 files
 * — those are semantic, not brand: money received, a settled repayment, an
 * approved document. Recolouring "money in" to rose because someone likes pink
 * would make the product lie, so the accent stops at chrome.
 *
 * `swatch` is only for the picker's preview dot; the real values live in CSS so
 * they can differ per colour scheme.
 */
export const ACCENTS = [
  { id: "graphite", labelKey: "graphite", swatch: "oklch(0.205 0 0)" },
  { id: "emerald", labelKey: "emerald", swatch: "oklch(0.60 0.14 163)" },
  { id: "blue", labelKey: "blue", swatch: "oklch(0.55 0.2 258)" },
  { id: "violet", labelKey: "violet", swatch: "oklch(0.55 0.24 292)" },
  { id: "amber", labelKey: "amber", swatch: "oklch(0.68 0.17 65)" },
  { id: "rose", labelKey: "rose", swatch: "oklch(0.58 0.22 15)" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

/** Graphite is the current design — the near-black/near-white neutral. */
export const DEFAULT_ACCENT: AccentId = "graphite";

export function parseAccentCookie(value?: string | null): AccentId {
  const match = ACCENTS.find((accent) => accent.id === value);
  return match ? match.id : DEFAULT_ACCENT;
}

/**
 * Corner radius, driven through `--radius`. Tailwind's whole radius scale is
 * derived from it (`--radius-sm` … `--radius-xl` in globals.css), so one value
 * restyles every card, button, input and dialog in the app at once.
 */
export const RADII = [
  { id: "sharp", labelKey: "sharp", value: "0rem" },
  { id: "default", labelKey: "default", value: "0.625rem" },
  { id: "rounded", labelKey: "rounded", value: "1rem" },
] as const;

export type RadiusId = (typeof RADII)[number]["id"];

export const DEFAULT_RADIUS: RadiusId = "default";

export function parseRadiusCookie(value?: string | null): RadiusId {
  const match = RADII.find((radius) => radius.id === value);
  return match ? match.id : DEFAULT_RADIUS;
}
