import { describe, it, expect } from "vitest";

import {
  deriveScore,
  scoreBand,
  buildProtections,
  type ProtectionItem,
} from "./protections";

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
    // With alerts off, `password` (25 of the 80 total) is the only "on" row:
    // 2FA and passkeys are off, not enabled, so they must not count toward
    // the score. Claiming otherwise was the bug.
    const withoutAlerts = deriveScore(buildProtections(false));
    expect(withoutAlerts).toBe(31);
    expect(scoreBand(withoutAlerts)).toBe("weak");

    // Turning sign-in alerts on adds its 10 points: 35/80.
    expect(deriveScore(buildProtections(true))).toBe(44);
  });

  it("counts two-factor auth once it is actually enabled", () => {
    // 2FA carries the largest weight (30) because it is the strongest control
    // on the list. It used to be permanently uncountable — the row was
    // hardcoded "unavailable" while there was no backend.
    expect(deriveScore(buildProtections(false, true))).toBe(69);
    expect(scoreBand(deriveScore(buildProtections(false, true)))).toBe("fair");

    // password 25 + alerts 10 + 2FA 30 = 65 of 80, with no passkey registered.
    expect(deriveScore(buildProtections(true, true))).toBe(81);
    expect(scoreBand(deriveScore(buildProtections(true, true)))).toBe("strong");
  });

  it("counts passkeys once one is actually registered", () => {
    // The row was hardcoded "unavailable" while there was no WebAuthn
    // backend. Now it reflects webauthn_credentials, so a fully protected
    // account scores 100 — which the score claimed was possible all along.
    expect(deriveScore(buildProtections(false, false, 1))).toBe(50);
    expect(deriveScore(buildProtections(true, true, 1))).toBe(100);
    expect(scoreBand(deriveScore(buildProtections(true, true, 1)))).toBe(
      "strong",
    );
  });

  it("treats an account with no passkey as off, never unavailable", () => {
    // "Unavailable" tells a user the feature does not exist. It does now, so
    // an empty list has to read as "not set up yet" — an invitation, not a
    // dead end.
    const passkey = buildProtections(false, false, 0).find(
      (item) => item.key === "passkey",
    );
    expect(passkey?.state).toBe("off");
    expect(passkey?.toggleable).toBe(true);
  });

  it("no longer includes the payout-account lock", () => {
    // The payout lock had no backend and was a hardcoded fake "on" row that
    // the score counted. It was removed as out of scope — nothing may
    // resurrect it silently.
    expect(
      buildProtections(true, true, 1).map((item) => item.key),
    ).not.toContain("withdrawalLock");
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
