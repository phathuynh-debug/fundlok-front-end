import { describe, it, expect } from "vitest";
import { kybIdentityStepEnabled } from "./kyb-flow";

// The SME KYB identity step: always on in production, hideable locally.

describe("kybIdentityStepEnabled", () => {
  it("is on by default", () => {
    expect(kybIdentityStepEnabled("development", undefined)).toBe(true);
    expect(kybIdentityStepEnabled("development", "true")).toBe(true);
  });

  it.each(["false", "FALSE", " false "])(
    "can be hidden locally with %j",
    (flag) => {
      expect(kybIdentityStepEnabled("development", flag)).toBe(false);
      expect(kybIdentityStepEnabled("test", flag)).toBe(false);
    },
  );

  it("can never be hidden in a production build", () => {
    expect(kybIdentityStepEnabled("production", "false")).toBe(true);
    expect(kybIdentityStepEnabled("production", undefined)).toBe(true);
  });

  it("treats anything other than false as on", () => {
    expect(kybIdentityStepEnabled("development", "0")).toBe(true);
    expect(kybIdentityStepEnabled("development", "")).toBe(true);
  });
});
