import { describe, it, expect } from "vitest";
import { CREATE_ERRORS, isTaxCode } from "./tax-code";

describe("isTaxCode", () => {
  it("takes a company's, a branch's and a household business's tax code, as people type them", () => {
    expect(isTaxCode("0123456789")).toBe(true);
    expect(isTaxCode("0123456789-001")).toBe(true);
    expect(isTaxCode("0123456789001")).toBe(true);
    expect(isTaxCode("079123456789")).toBe(true);
    expect(isTaxCode(" 0123 456.789 ")).toBe(true);
  });

  it("refuses anything else, as the backend does", () => {
    for (const bad of [
      "",
      "TAX-123",
      "12345",
      "0123456789-01",
      "01234567890",
      "abcdefghij",
    ]) {
      expect(isTaxCode(bad)).toBe(false);
    }
  });
});

describe("CREATE_ERRORS", () => {
  it("covers every refusal the backend gives a new project", () => {
    expect([...CREATE_ERRORS].sort()).toEqual([
      "DUPLICATE_TAX_CODE",
      "INVALID_TAX_CODE",
      "SME_HAS_OPEN_PROJECT",
      "TAX_CODE_NOT_VERIFIED_BUSINESS",
    ]);
  });
});
