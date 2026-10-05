// Categorical palette for the by-industry donut.
//
// This is the one chart on the page where colour carries IDENTITY (which
// industry) rather than which series. `SERIES_COLORS` cannot be reused for it:
// deployed-orange and returns-teal already mean something page-wide, and the
// repo's --chart-1..5 are unusable as a categorical set (slots 4 and 5 are both
// amber, ΔE 7.4 under normal vision against a floor of 15 — see chart-colors.ts).
//
// So these five hues are deliberately chosen to avoid the two page series: no
// orange, no teal. Nothing on this page means two things.
//
// Verified with the dataviz validator (OKLab ΔE ×100, Machado–Oliveira–Fernandes
// CVD simulation at severity 1.0) against --card in each mode:
//
//   light  surface #ffffff  ALL CHECKS PASS  worst adjacent ΔE 16.3 deutan / 19.6 normal
//   dark   surface #0a0a0a  ALL CHECKS PASS  worst adjacent ΔE 13.2 deutan / 19.3 normal
//
// Light mode carries a contrast WARN on yellow (2.17:1) and magenta (2.69:1)
// against white. That warning is not dismissable — it obliges visible labels or
// a table view, and this chart has both: a legend labelling every slice with its
// value, plus the page's own table view. The 2px slice gaps are the secondary
// encoding, so identity never rests on hue alone.
//
// Re-run after any change:
//   node scripts/validate_palette.js "#2a78d6,#eda100,#e87ba4,#4a3aa7,#008300" --mode light --surface "#ffffff"
//   node scripts/validate_palette.js "#3987e5,#c98500,#d55181,#9085e9,#008300" --mode dark  --surface "#0a0a0a"
//
// Fixed order, never cycled: slot N always belongs to the same industry for a
// given dataset order, so a filter that drops one industry does not repaint the
// survivors. A sixth industry does not get a generated hue — it folds into an
// "Other" slice (see INDUSTRY_SLICE_LIMIT).

export const INDUSTRY_COLORS = [
  { light: "#2a78d6", dark: "#3987e5" }, // blue
  { light: "#eda100", dark: "#c98500" }, // yellow
  { light: "#e87ba4", dark: "#d55181" }, // magenta
  { light: "#4a3aa7", dark: "#9085e9" }, // violet
  { light: "#008300", dark: "#008300" }, // green
] as const;

/**
 * A donut is legible for part-to-whole "at a glance" only, and past ~6 segments
 * adjacent slices blur. Anything beyond this many industries is aggregated into
 * a single "Other" slice rather than given a new hue.
 */
export const INDUSTRY_SLICE_LIMIT = INDUSTRY_COLORS.length;
