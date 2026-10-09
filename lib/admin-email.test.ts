import { describe, expect, it } from "vitest";
import { isFundlokEmail } from "./admin-email";

describe("isFundlokEmail", () => {
  it("recognizes standard @fundlok.com emails", () => {
    expect(isFundlokEmail("ten@fundlok.com")).toBe(true);
    expect(isFundlokEmail("admin.finance@fundlok.com")).toBe(true);
    expect(isFundlokEmail("ops_lead+test@fundlok.com")).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(isFundlokEmail("  Ten@Fundlok.COM  ")).toBe(true);
    expect(isFundlokEmail("SUPPORT@FUNDLOK.COM")).toBe(true);
  });

  it("identifies external domains as non-fundlok", () => {
    expect(isFundlokEmail("edwardw@gmail.com")).toBe(false);
    expect(isFundlokEmail("user@yahoo.com")).toBe(false);
    expect(isFundlokEmail("admin@partner.vn")).toBe(false);
    expect(isFundlokEmail("admin@fundlok.vn")).toBe(false);
  });

  it("rejects lookalikes, subdomains, and malicious domain suffixes", () => {
    expect(isFundlokEmail("admin@fakefundlok.com")).toBe(false);
    expect(isFundlokEmail("admin@fundlok.com.attacker.com")).toBe(false);
    expect(isFundlokEmail("admin@sub.fundlok.com")).toBe(false);
    expect(isFundlokEmail("admin@notfundlok.com")).toBe(false);
  });

  it("handles empty or invalid inputs gracefully", () => {
    expect(isFundlokEmail("")).toBe(false);
    expect(isFundlokEmail("   ")).toBe(false);
    expect(isFundlokEmail(null)).toBe(false);
    expect(isFundlokEmail(undefined)).toBe(false);
    expect(isFundlokEmail("fundlok.com")).toBe(false);
    expect(isFundlokEmail("@fundlok.com")).toBe(false);
  });
});
