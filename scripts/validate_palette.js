#!/usr/bin/env node
//
// Categorical-palette validator for the analytics charts.
//
// app/dashboard/analytics/_components/chart-colors.ts documents its palette as
// having passed this check and tells the next person to re-run it after any
// change — but the script itself was never committed, so the instruction could
// not be followed and SERIES_COLORS could drift without anyone noticing. This
// is that script.
//
// Three checks, all of which a two-series chart has to pass:
//
//   1. CONTRAST — each mark against the surface it sits on. Marks (bars, lines)
//      are non-text graphics, so the floor is WCAG 1.4.11's 3:1, not 4.5:1.
//   2. SEPARATION — every pair of series, as OKLab ΔE x100, under normal vision
//      AND under simulated protanopia, deuteranopia and tritanopia. A palette
//      that separates only for trichromats is not a palette.
//   3. LIGHTNESS BAND — dark mode only. A hue light enough to read on white is
//      usually too dark on near-black; 0.48-0.67 OKLab L is the band that holds
//      up on the repo's #0a0a0a card.
//
// CVD simulation is Machado, Oliveira & Fernandes (2009) at severity 1.0,
// applied in linear RGB — the same model Chrome DevTools and matplotlib use.
//
// Usage:
//   node scripts/validate_palette.js "#f54900,#009689" --mode light --surface "#ffffff"
//   node scripts/validate_palette.js "#ec6100,#00ab9d" --mode dark  --surface "#0a0a0a"
//
// Exits non-zero if any check fails, so CI can gate on it.

const DELTA_E_FLOOR = 15; // OKLab ΔE x100, adjacent series
const CONTRAST_FLOOR = 3; // WCAG 1.4.11 non-text contrast
const DARK_L_MIN = 0.48;
const DARK_L_MAX = 0.67;

// --- colour conversions -----------------------------------------------------

function parseHex(hex) {
  const h = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`bad hex: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

function linearize([r, g, b]) {
  return [toLinear(r), toLinear(g), toLinear(b)];
}

/** Relative luminance, WCAG 2.x. */
function luminance(rgb) {
  const [r, g, b] = linearize(rgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Linear sRGB -> OKLab (Björn Ottosson). */
function oklab(rgb) {
  const [r, g, b] = linearize(rgb);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

/** Perceptual distance, scaled x100 so the numbers read like CIE ΔE. */
function deltaE(a, b) {
  const [l1, a1, b1] = oklab(a);
  const [l2, a2, b2] = oklab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100;
}

// Machado et al. (2009), severity 1.0, operating on linear RGB.
const CVD = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const toGamma = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

function simulate(rgb, kind) {
  const lin = linearize(rgb);
  const m = CVD[kind];
  return m
    .map((row) => row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])
    .map((v) => toGamma(Math.min(1, Math.max(0, v))));
}

// --- runner -----------------------------------------------------------------

function main(argv) {
  const positional = [];
  const opts = { mode: "light", surface: null };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--mode") opts.mode = argv[++i];
    else if (argv[i] === "--surface") opts.surface = argv[++i];
    else positional.push(argv[i]);
  }

  if (!positional[0]) {
    console.error(
      'usage: node scripts/validate_palette.js "#aabbcc,#ddeeff" --mode light --surface "#ffffff"',
    );
    return 2;
  }

  const hexes = positional[0]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const surfaceHex =
    opts.surface ?? (opts.mode === "dark" ? "#0a0a0a" : "#ffffff");
  const surface = parseHex(surfaceHex);
  const colors = hexes.map(parseHex);

  const failures = [];
  console.log(
    `mode ${opts.mode}  surface ${surfaceHex}  ${hexes.length} series\n`,
  );

  // 1. contrast against the surface
  console.log("contrast vs surface (floor 3.0:1)");
  hexes.forEach((hex, i) => {
    const ratio = contrastRatio(colors[i], surface);
    const ok = ratio >= CONTRAST_FLOOR;
    if (!ok)
      failures.push(
        `${hex} contrast ${ratio.toFixed(2)}:1 < ${CONTRAST_FLOOR}`,
      );
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${hex}  ${ratio.toFixed(2)}:1`);
  });

  // 2. pairwise separation, normal + CVD
  console.log(`\nseparation, OKLab ΔE x100 (floor ${DELTA_E_FLOOR})`);
  const views = ["normal", "protan", "deutan", "tritan"];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const row = views.map((view) => {
        const a = view === "normal" ? colors[i] : simulate(colors[i], view);
        const b = view === "normal" ? colors[j] : simulate(colors[j], view);
        const d = deltaE(a, b);
        if (d < DELTA_E_FLOOR)
          failures.push(
            `${hexes[i]} vs ${hexes[j]} ΔE ${d.toFixed(1)} under ${view} < ${DELTA_E_FLOOR}`,
          );
        return `${view} ${d.toFixed(1)}`;
      });
      const worst = Math.min(
        ...views.map((view) => {
          const a = view === "normal" ? colors[i] : simulate(colors[i], view);
          const b = view === "normal" ? colors[j] : simulate(colors[j], view);
          return deltaE(a, b);
        }),
      );
      console.log(
        `  ${worst >= DELTA_E_FLOOR ? "PASS" : "FAIL"}  ${hexes[i]} vs ${hexes[j]}  ${row.join("  ")}`,
      );
    }
  }

  // 3. dark-mode lightness band
  if (opts.mode === "dark") {
    console.log(`\ndark lightness band (OKLab L ${DARK_L_MIN}-${DARK_L_MAX})`);
    hexes.forEach((hex, i) => {
      const L = oklab(colors[i])[0];
      const ok = L >= DARK_L_MIN && L <= DARK_L_MAX;
      if (!ok)
        failures.push(
          `${hex} L ${L.toFixed(3)} outside ${DARK_L_MIN}-${DARK_L_MAX}`,
        );
      console.log(`  ${ok ? "PASS" : "FAIL"}  ${hex}  L ${L.toFixed(3)}`);
    });
  }

  if (failures.length) {
    console.log(`\n${failures.length} FAILURE(S):`);
    for (const f of failures) console.log(`  - ${f}`);
    return 1;
  }

  console.log("\nALL CHECKS PASS");
  return 0;
}

process.exit(main(process.argv.slice(2)));
