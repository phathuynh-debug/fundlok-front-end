import { describe, it, expect } from "vitest";
import { postVerificationTarget, kycLandingForRole } from "./kyc-landing";

describe("kycLandingForRole", () => {
  it("routes ADMIN to /admin", () => {
    expect(kycLandingForRole("ADMIN")).toBe("/admin");
    expect(kycLandingForRole("SYSTEM_ADMIN")).toBe("/admin");
  });

  it("routes SME to /project-application", () => {
    expect(kycLandingForRole("SME")).toBe("/project-application");
  });

  it("defaults to /dashboard for INVESTOR and unknown roles", () => {
    expect(kycLandingForRole("INVESTOR")).toBe("/dashboard");
    expect(kycLandingForRole(null)).toBe("/dashboard");
    expect(kycLandingForRole(undefined)).toBe("/dashboard");
  });
});

describe("postVerificationTarget", () => {
  it("accepts safe relative paths", () => {
    expect(postVerificationTarget("/dashboard/invest", "INVESTOR")).toBe(
      "/dashboard/invest",
    );
    expect(postVerificationTarget("/project-application?step=2", "SME")).toBe(
      "/project-application?step=2",
    );
  });

  it("blocks protocol-relative URLs with double slashes", () => {
    expect(postVerificationTarget("//evil.com", "INVESTOR")).toBe("/dashboard");
    expect(postVerificationTarget("//evil.com/phish", "SME")).toBe(
      "/project-application",
    );
  });

  it("blocks protocol-relative open redirect bypasses using backslashes", () => {
    expect(postVerificationTarget("/\\evil.com", "INVESTOR")).toBe(
      "/dashboard",
    );
    expect(postVerificationTarget("/\\\\evil.com", "INVESTOR")).toBe(
      "/dashboard",
    );
    expect(postVerificationTarget("/\\evil.com/path", "SME")).toBe(
      "/project-application",
    );
  });

  it("blocks absolute URLs to external domains", () => {
    expect(postVerificationTarget("https://evil.com", "INVESTOR")).toBe(
      "/dashboard",
    );
    expect(postVerificationTarget("javascript:alert(1)", "INVESTOR")).toBe(
      "/dashboard",
    );
  });
});
