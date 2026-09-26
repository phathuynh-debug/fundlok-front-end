import { describe, it, expect } from "vitest";

import {
  LOAN_DURATIONS_MONTHS,
  LOAN_MAX_VND,
  LOAN_MIN_VND,
  isAllowedLoanDuration,
} from "@/lib/constants/loan-constraints";
import { MOCK_SME_FUNDING } from "./mock-sme-funding";
import { MOCK_SME_FACILITY } from "../analytics/_components/sme/mock-sme-analytics";
import { ALLOWED_TERM_MONTHS } from "@/lib/facility-terms";

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
const SME_MOCK_LOANS = [
  {
    label: "MOCK_SME_FUNDING (dashboard funding panel)",
    principal: MOCK_SME_FUNDING.requested,
    term_months: MOCK_SME_FUNDING.term_months,
  },
  {
    label: "MOCK_SME_FACILITY (SME analytics)",
    principal: MOCK_SME_FACILITY.principal,
    term_months: MOCK_SME_FACILITY.term_months,
  },
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

  it("only ever funds up to what was requested", () => {
    expect(MOCK_SME_FUNDING.funded).toBeLessThanOrEqual(
      MOCK_SME_FUNDING.requested,
    );
    expect(MOCK_SME_FUNDING.funded).toBeGreaterThanOrEqual(0);
  });

  it("guards a term the engine rejects", () => {
    // Proves the assertion above can actually fail: 10 months is the value
    // that shipped on the investment KPI card before SCRUM-150.
    expect(isAllowedLoanDuration(10)).toBe(false);
    expect(LOAN_DURATIONS_MONTHS).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

// The engine's YAML still accepts 3- and 9-month terms, but the FundLok
// Handbook v3 §2 says an SME declares 6 or 12 months and twelve is the
// maximum. The two disagree, and that disagreement is for the CEO to settle —
// not for a mock file. Until it is settled these mocks sit in the INTERSECTION
// of both rules, which is always safe: a 6 or 12 month term satisfies the
// handbook and the engine at once.
describe("SME mock terms also satisfy the handbook, not just the engine", () => {
  it.each(SME_MOCK_LOANS)(
    "$label declares 6 or 12 months",
    ({ term_months }) => {
      expect(ALLOWED_TERM_MONTHS as readonly number[]).toContain(term_months);
    },
  );
});
