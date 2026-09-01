import { describe, it, expect } from "vitest";

import {
  deriveScore,
  scoreBand,
  buildProtections,
  type ProtectionItem,
} from "./mock-security";

// deriveScore/scoreBand are the only logic on the security screen — they are
// pure so they survive the move to a real API, which is exactly why they are
// worth pinning down here.

const item = (overrides: Partial<ProtectionItem>): ProtectionItem => ({
  key: "x",
  state: "off",
  toggleable: true,
  weight: 10,
  ...overrides,
});

describe("deriveScore", () => {
  it("returns 0 when nothing is on", () => {
    expect(deriveScore([item({ weight: 30 }), item({ weight: 70 })])).toBe(0);
  });

  it("returns 100 when everything is on", () => {
    expect(
      deriveScore([
        item({ state: "on", weight: 30 }),
        item({ state: "on", weight: 70 }),
      ]),
    ).toBe(100);
  });

  it("weights each protection rather than counting them", () => {
    // 30 of 100 possible weight is on, even though 1 of 2 items is on
    expect(
      deriveScore([item({ state: "on", weight: 30 }), item({ weight: 70 })]),
    ).toBe(30);
  });

  it("treats a recommended protection as not yet on", () => {
    expect(
      deriveScore([
        item({ state: "on", weight: 50 }),
        item({ state: "recommended", weight: 50 }),
      ]),
    ).toBe(50);
  });

  it("does not divide by zero on an empty list", () => {
    expect(deriveScore([])).toBe(0);
  });

  it("scores only the protections that are actually on", () => {
    // With alerts off, `password` (25) and the payout lock (20) are the only
    // "on" rows: 2FA and passkeys are unavailable, not enabled, so they must
    // not count toward the score. Claiming otherwise was the bug.
    const withoutAlerts = deriveScore(buildProtections(false));
    expect(withoutAlerts).toBe(45);
    expect(scoreBand(withoutAlerts)).toBe("weak");

    // Turning sign-in alerts on adds its 10 points.
    expect(deriveScore(buildProtections(true))).toBe(55);
  });

  it("counts two-factor auth once it is actually enabled", () => {
    // 2FA carries the largest weight (30) because it is the strongest control
    // on the list. It used to be permanently uncountable — the row was
    // hardcoded "unavailable" while there was no backend.
    expect(deriveScore(buildProtections(false, true))).toBe(75);
    expect(scoreBand(deriveScore(buildProtections(false, true)))).toBe("fair");

    // Everything the user can currently turn on: password 25 + payout lock 20
    // + alerts 10 + 2FA 30 = 85. Passkeys (15) remain unavailable, so 100 is
    // still unreachable — deliberately, rather than flattering the score.
    expect(deriveScore(buildProtections(true, true))).toBe(85);
    expect(scoreBand(deriveScore(buildProtections(true, true)))).toBe("strong");
  });
});

describe("scoreBand", () => {
  it.each([
    [100, "strong"],
    [80, "strong"],
    [79, "fair"],
    [50, "fair"],
    [49, "weak"],
    [0, "weak"],
  ] as const)("maps %i to %s", (score, band) => {
    expect(scoreBand(score)).toBe(band);
  });
});
