import { describe, it, expect } from "vitest";
import {
  isSecondFactorRequired,
  shouldRedirectToSecondFactorSetup,
} from "./second-factor";

describe("isSecondFactorRequired", () => {
  it("recognises the backend's refusal by its code", () => {
    expect(
      isSecondFactorRequired({
        message: "Admin accounts must sign in with a second factor.",
        status: 403,
        code: "MFA_REQUIRED",
      }),
    ).toBe(true);
  });

  it.each([
    { message: "Forbidden", status: 403 },
    { message: "Not an admin", status: 403, code: "FORBIDDEN" },
    null,
    undefined,
  ])("ignores everything else (%j)", (error) => {
    expect(isSecondFactorRequired(error)).toBe(false);
  });
});

describe("shouldRedirectToSecondFactorSetup", () => {
  it.each(["/admin", "/admin/users", "/admin/system", "/dashboard"])(
    "sends %s to the setup page",
    (pathname) => {
      expect(shouldRedirectToSecondFactorSetup(pathname)).toBe(true);
    },
  );

  // The setup page's own calls are refused too. Redirecting from it would
  // reload it forever.
  it.each(["/admin/security", "/admin/security/anything"])(
    "never redirects from the setup page (%s)",
    (pathname) => {
      expect(shouldRedirectToSecondFactorSetup(pathname)).toBe(false);
    },
  );

  it("does not mistake a lookalike path for the setup page", () => {
    expect(shouldRedirectToSecondFactorSetup("/admin/security-logs")).toBe(
      true,
    );
  });
});
