// A Vietnamese tax code (app/projects/borrower.py): 10 digits, a branch's
// 10-3 digits, or a 12-digit personal number for a household business.
// Spaces and dots as people type them are ignored.
const TAX_CODE = /^(\d{10}(-?\d{3})?|\d{12})$/;
export function isTaxCode(value: string): boolean {
  return TAX_CODE.test(value.replace(/[\s.]/g, ""));
}

// Refusals the business can act on, by X-Error-Code: one business has one
// project, it must be the business the SME verified, and an SME starts a new
// project only once the last one has ended (docs/specs/projects/one-borrower.md).
export const CREATE_ERRORS = new Set([
  "INVALID_TAX_CODE",
  "DUPLICATE_TAX_CODE",
  "TAX_CODE_NOT_VERIFIED_BUSINESS",
  "SME_HAS_OPEN_PROJECT",
]);
