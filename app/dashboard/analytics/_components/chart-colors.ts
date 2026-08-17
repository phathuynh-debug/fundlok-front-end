// Series colors for the analytics charts.
//
// Two series carry identity here — capital deployed and returns received — and
// colour follows the entity, so the same hue means the same thing in every
// chart on the page: the by-industry bars are deployed capital (orange), the
// by-month columns are returns (teal).
//
// LIGHT values are the repo's own --chart-1 / --chart-2 converted to hex.
// DARK values are the SAME hues re-stepped for the dark surface, not the
// repo's dark --chart-1 / --chart-2, which do not hold up:
//
//   #1447e6 (dark --chart-1) sits at 2.9:1 against the dark card, under the 3:1
//   floor for marks, and #00bc7d (dark --chart-2) sits at L 0.702, above the
//   0.48–0.67 dark lightness band. Holding the light hues and moving only the
//   lightness — the standard snap-to-passing move — clears both.
//
// Verified with the dataviz validator (OKLab ΔE ×100, Machado–Oliveira–Fernandes
// CVD simulation at severity 1.0), against --card in each mode:
//
//   light  surface #ffffff  ALL CHECKS PASS  worst adjacent ΔE 14.8 protan / 31.6 normal
//   dark   surface #0a0a0a  ALL CHECKS PASS  worst adjacent ΔE 15.9 deutan / 29.0 normal
//
// Re-run after any change:
//   node scripts/validate_palette.js "#f54900,#009689" --mode light --surface "#ffffff"
//   node scripts/validate_palette.js "#ec6100,#00ab9d" --mode dark  --surface "#0a0a0a"
//
// Note the full five-slot --chart-1..5 set is NOT usable as a categorical
// palette: slots 4 and 5 are both amber and collapse to ΔE 7.4 under normal
// vision (floor is 15). Anything on this page that needed more than two
// identities was given a different form instead of more hues.

export const SERIES_COLORS = {
  deployed: { light: "#f54900", dark: "#ec6100" },
  returns: { light: "#009689", dark: "#00ab9d" },
} as const;
