// Frontend-only sample data for the SME half of /dashboard.
//
// The SME hero above this panel is REAL — legal name, industry, tax id and the
// loan-application state all come from useMyProjects(). What is mocked here is
// everything downstream of a signed contract: funding progress, disbursement,
// and the repayment schedule. Those live in app/ledger/, app/contracts/ and
// app/repayment_schedule/ on the backend and have no read API yet, so this sits
// outside services/ rather than pretending to be the real data pipeline.
//
// When those endpoints land: move the types into a service, add the
// endpoint/service/hook layers, delete the MOCK_* constants and read from the
// hook. `summarizeFunding` is pure and moves across unchanged.
//
// Amounts are VND integers; dates are fixed ISO strings so the screen renders
// identically on every load.

export type InstallmentStatus =
  /** Settled — the ledger has a matching REPAYMENT entry. */
  | "PAID"
  /** Settled ahead of its due date. Early repayment is a platform value, so it
   *  gets its own state rather than being folded into PAID. */
  | "EARLY"
  /** Next one owed. */
  | "DUE"
  /** Later in the schedule. */
  | "UPCOMING";

export interface Installment {
  /** 1-based position in the amortization schedule. */
  number: number;
  due_date: string;
  /** Principal component, VND. */
  principal: number;
  /** Interest component, VND. */
  interest: number;
  status: InstallmentStatus;
  /** When it was actually settled, for PAID/EARLY rows. */
  paid_date?: string;
}

export interface SmeFunding {
  /** Amount asked for in the application, VND. */
  requested: number;
  /** Amount raised from lenders so far, VND. */
  funded: number;
  /** Distinct lenders in the syndicate. */
  investor_count: number;
  /** Grade assigned by the underwriting engine. */
  grade: string;
  /** Contractual rate for the loan, percent per annum. */
  interest_rate_pct: number;
  term_months: number;
  /** When the omnibus account paid out, or null while still funding. */
  disbursed_at: string | null;
}

export const MOCK_SME_FUNDING: SmeFunding = {
  requested: 1250000000,
  funded: 875000000,
  investor_count: 14,
  grade: "B+",
  interest_rate_pct: 14.5,
  term_months: 12,
  disbursed_at: "2026-05-18",
};

// A 12-month schedule, three settled (one of them early) and the rest ahead.
// Interest falls as principal amortizes — a flat interest column would be the
// giveaway that these numbers were typed rather than amortized.
export const MOCK_INSTALLMENTS: Installment[] = [
  {
    number: 1,
    due_date: "2026-06-18",
    principal: 68500000,
    interest: 15100000,
    status: "PAID",
    paid_date: "2026-06-18",
  },
  {
    number: 2,
    due_date: "2026-07-18",
    principal: 69300000,
    interest: 14300000,
    status: "EARLY",
    paid_date: "2026-07-09",
  },
  {
    number: 3,
    due_date: "2026-08-18",
    principal: 70200000,
    interest: 13400000,
    status: "PAID",
    paid_date: "2026-08-17",
  },
  {
    number: 4,
    due_date: "2026-09-18",
    principal: 71000000,
    interest: 12600000,
    status: "DUE",
  },
  {
    number: 5,
    due_date: "2026-10-18",
    principal: 71900000,
    interest: 11700000,
    status: "UPCOMING",
  },
  {
    number: 6,
    due_date: "2026-11-18",
    principal: 72800000,
    interest: 10800000,
    status: "UPCOMING",
  },
];

export interface FundingSummary {
  /** Share of the ask raised, 0-100. */
  funded_pct: number;
  /** Principal + interest already settled, VND. */
  repaid: number;
  /** Principal + interest still scheduled, VND. */
  outstanding: number;
  /** Installments settled, early ones included. */
  settled_count: number;
  total_count: number;
  /** The next installment owed, or null when the schedule is finished. */
  next: Installment | null;
}

const isSettled = (status: InstallmentStatus) =>
  status === "PAID" || status === "EARLY";

const total = (installment: Installment) =>
  installment.principal + installment.interest;

export function summarizeFunding(
  funding: SmeFunding,
  installments: Installment[],
): FundingSummary {
  const settled = installments.filter((i) => isSettled(i.status));

  return {
    funded_pct:
      funding.requested === 0
        ? 0
        : Math.round((funding.funded / funding.requested) * 1000) / 10,
    repaid: settled.reduce((sum, i) => sum + total(i), 0),
    outstanding: installments
      .filter((i) => !isSettled(i.status))
      .reduce((sum, i) => sum + total(i), 0),
    settled_count: settled.length,
    total_count: installments.length,
    // The schedule is authored in order, so the first unsettled row is the
    // next one owed — no date comparison, which would drift as time passes
    // against these fixed dates.
    next: installments.find((i) => !isSettled(i.status)) ?? null,
  };
}
