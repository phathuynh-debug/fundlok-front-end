// Series colors for the analytics charts.
//
// Two series carry identity here — capital deployed and money received — and
// colour follows the entity, so the same hue means the same thing in every
// chart on the page: deployed capital is slate, money received is emerald.
// That invariant is why these live in one file rather than per chart.
//
// The semantic split is deliberate and one-directional: EMERALD MEANS MONEY
// COMING BACK, everywhere in this app. Deployed capital is money that has left
// — it is the baseline being measured against, not an outcome — so it gets a
// neutral, deliberately unexciting slate. Reading a chart should not require
// the legend: the green bar is the one you earn.
//
// The previous pairing was orange (deployed) / teal (returns). Both survived
// on contrast, but orange-vs-teal is the classic red-green confusion axis and
// separated by only ΔE 14.8 under simulated protanopia — under the 15 floor,
// i.e. the two series were near-indistinguishable for roughly 1 in 12 men.
// Slate-vs-emerald splits on lightness as well as hue, which is the channel
// CVD leaves intact, and clears the floor in every simulation.
//
// Blue was tried first for "deployed" and rejected on evidence, not taste:
// #1d4ed8 vs #059669 collapses to ΔE 11.0 under tritanopia (#2563eb is worse
// at 6.6). Slate keeps all four views above the floor.
//
// LIGHT and DARK are the same two hues re-stepped per surface, never the same
// hex twice: a colour readable on white is too dark on #0a0a0a, and one
// readable on near-black glares on white. Dark values are held inside the
// 0.48–0.67 OKLab lightness band, which is where marks sit correctly on the
// repo's dark card.
//
// Verified with scripts/validate_palette.js (OKLab ΔE ×100, Machado–Oliveira–
// Fernandes CVD simulation at severity 1.0), against --card in each mode:
//
//   light  surface #ffffff  ALL CHECKS PASS  worst adjacent ΔE 16.7 deutan / 20.2 normal
//                           contrast 7.58:1 slate, 3.77:1 emerald
//   dark   surface #0a0a0a  ALL CHECKS PASS  worst adjacent ΔE 16.7 deutan / 21.1 normal
//                           contrast 3.35:1 slate, 6.70:1 emerald, L 0.503 / 0.656
//
// Re-run after any change — the script exits non-zero on failure:
//   node scripts/validate_palette.js "#475569,#059669" --mode light --surface "#ffffff"
//   node scripts/validate_palette.js "#5a6575,#0aab78" --mode dark  --surface "#0a0a0a"
//
// Note the full five-slot --chart-1..5 set is NOT usable as a categorical
// palette: slots 4 and 5 are both amber and collapse to ΔE 7.4 under normal
// vision (floor is 15). Anything on this page that needed more than two
// identities was given a different form instead of more hues.

export const SERIES_COLORS = {
  /** Capital deployed — money that has left. Neutral by design. */
  deployed: { light: "#475569", dark: "#5a6575" },
  /** Money received back. Emerald is reserved for this meaning app-wide. */
  returns: { light: "#059669", dark: "#0aab78" },
} as const;
