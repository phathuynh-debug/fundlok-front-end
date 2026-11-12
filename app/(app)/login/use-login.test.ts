import { afterEach, describe, expect, it } from "vitest";

import type { User } from "@/services/authentication.service";
import { landingRouteFor, signInReturnPath } from "./use-login";

const sme = { role: "SME" } as User;
const repayment = "/dashboard/repayments/3f2b8c1e-5a7d-4e9b-9c21-7d4e8a6b1f02";

describe("landingRouteFor", () => {
  it("returns a signed-in user to the page they were sent from", () => {
    expect(landingRouteFor(sme, repayment)).toBe(repayment);
  });

  it("falls back to the dashboard without a usable `from`", () => {
    expect(landingRouteFor(sme)).toBe("/dashboard");
    expect(landingRouteFor(sme, null)).toBe("/dashboard");
    expect(landingRouteFor(sme, "")).toBe("/dashboard");
  });

  it("never follows `from` off the site", () => {
    expect(landingRouteFor(sme, "https://evil.example/phish")).toBe(
      "/dashboard",
    );
    expect(landingRouteFor(sme, "//evil.example")).toBe("/dashboard");
    expect(landingRouteFor(sme, "/.//evil.example")).toBe("/dashboard");
  });

  it("keeps the gates ahead of `from`", () => {
    expect(landingRouteFor({ role: "ADMIN" } as User, repayment)).toBe(
      "/admin",
    );
    expect(landingRouteFor({} as User, repayment)).toBe("/select-role");
  });

  it("carries `from` through the phone gate as ?next=", () => {
    const unverified = {
      role: "SME",
      phone_verification_required: true,
    } as User;
    expect(landingRouteFor(unverified, repayment)).toBe(
      `/verify-phone?next=${encodeURIComponent(repayment)}`,
    );
    expect(landingRouteFor(unverified)).toBe("/verify-phone");
    expect(landingRouteFor(unverified, "//evil.example")).toBe(
      "/verify-phone",
    );
  });
});

describe("signInReturnPath", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("reads the `from` the proxy put on /login", () => {
    window.history.replaceState(null, "", `/login?from=${repayment}`);
    expect(signInReturnPath()).toBe(repayment);
  });

  it("reads the `next` landingRouteFor put on /verify-phone", () => {
    window.history.replaceState(
      null,
      "",
      `/verify-phone?next=${encodeURIComponent(repayment)}`,
    );
    expect(signInReturnPath()).toBe(repayment);
  });

  it("is null on a plain /login", () => {
    window.history.replaceState(null, "", "/login");
    expect(signInReturnPath()).toBeNull();
  });
});
