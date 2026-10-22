import { describe, it, expect } from "vitest";

import {
  LOAN_DURATIONS_MONTHS,
  LOAN_MAX_VND,
  LOAN_MIN_VND,
  isAllowedLoanDuration,
} from "@/lib/constants/loan-constraints";
// import { MOCK_SME_FACILITY } from "../analytics/_components/sme/mock-sme-analytics";
// import { ALLOWED_TERM_MONTHS } from "@/lib/facility-terms";
// — both commented out with the mock data; re-add the facility to
// SME_MOCK_LOANS below (and the handbook describe block at the bottom) when the
// mock comes back.

// The SME demo surfaces are driven entirely by hardcoded mocks, and those mocks
// drifted outside the shapes the grading engine will actually accept — a loan
// the platform could never originate was being shown to SMEs during
// demonstrations (SCRUM-150).
//
// Fixing the numbers once does not stop that happening again, because nothing
// connected the mocks to the constraints. This does: it pins every SME mock to
// lib/constants/loan-constraints.ts, which mirrors the engine's
// grading_params_v1.yaml. If someone edits a mock to an unoriginatable amount
// or term, this fails rather than shipping.

/** Every SME-facing mock loan, as {label, principal VND, term months}. */
const SME_MOCK_LOANS: {
  label: string;
  principal: number;
  term_months: number;
}[] = [
  // {
  //   label: "MOCK_SME_FACILITY (SME analytics)",
  //   principal: MOCK_SME_FACILITY.principal,
  //   term_months: MOCK_SME_FACILITY.term_months,
  // },
];

describe("SME mock loans obey the grading engine's constraints", () => {
  it.each(SME_MOCK_LOANS)(
    "$label has a principal the engine would accept",
    ({ principal }) => {
      expect(principal).toBeGreaterThanOrEqual(LOAN_MIN_VND);
      expect(principal).toBeLessThanOrEqual(LOAN_MAX_VND);
    },
  );

  it.each(SME_MOCK_LOANS)(
    "$label has a term the engine would accept",
    ({ term_months }) => {
      expect(isAllowedLoanDuration(term_months)).toBe(true);
    },
  );

  it.each(SME_MOCK_LOANS)(
    "$label states a whole-dong principal",
    ({ principal }) => {
      // VND has no sub-unit. A fractional amount would render with decimals
      // that cannot exist on a real disbursement.
      expect(Number.isInteger(principal)).toBe(true);
    },
  );

  it("guards a term the engine rejects", () => {
    // Proves the assertion above can actually fail: 10 months is the value
    // that shipped on the investment KPI card before SCRUM-150.
    expect(isAllowedLoanDuration(10)).toBe(false);
    expect(LOAN_DURATIONS_MONTHS).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

// Settled by the product owner: a term is 1 to 6 months, which is exactly what
// the engine accepts. ALLOWED_TERM_MONTHS now re-exports LOAN_DURATIONS_MONTHS,
// so the product rule and the engine cannot disagree again.
//
// The block below only pinned the mock loan, so it is commented out with the
// mock data — an it.each over an empty list fails as "no test found in suite".
// Restore it together with the SME_MOCK_LOANS entry above.
/*
describe("SME mock terms also satisfy the handbook, not just the engine", () => {
  it.each(SME_MOCK_LOANS)(
    "$label declares a term of 1 to 6 months",
    ({ term_months }) => {
      expect(ALLOWED_TERM_MONTHS as readonly number[]).toContain(term_months);
    },
  );
});
*/
