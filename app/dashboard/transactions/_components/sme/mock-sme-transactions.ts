// Frontend-only sample data for the SME side of /dashboard/transactions.
//
// FE-013, same finding as the analytics screen: the investor ledger is
// investments, returns, deposits and withdrawals. A borrower has none of those.
// Its money movements are the other half of the omnibus flow described in
// CLAUDE.md:
//
//   FL omnibus  -> borrower   DISBURSEMENT     money in
//   borrower    -> FL omnibus REPAYMENT        money out
//   FL omnibus  -> FL revenue FEE              deducted from the disbursement
//
// plus EARLY_REPAYMENT, which the platform actively encourages (CLAUDE.md), so
// it is a first-class row rather than an unexplained large repayment.
//
// Signs follow the SME's own account: positive is money arriving, negative is
// money leaving. Same convention as the investor mock, opposite direction of
// travel for the same underlying transfer.
//
// The loan here is the SAME loan as sme/mock-sme-analytics.ts — 800M principal,
// 9 months, 98,436,421 VND monthly instalment. FE-013 was raised because the
// numbers on one screen did not reconcile with another; two mocks describing
// one borrower have to agree.
//
// No backend supplies any of this yet (no ledger API, no repayment schedule
// module), so it sits under the route that renders it rather than pretending to
// be a service. Swap is mechanical: move the types into a service, add the
// endpoint/hook layers, delete MOCK_*, read from the hook.

import type { Transaction, TransactionType } from "../mock-transactions";

/** Filter chips for the SME view — the four flows a borrower actually sees. */
export const SME_TYPE_FILTERS: TransactionType[] = [
  "DISBURSEMENT",
  "REPAYMENT",
  "EARLY_REPAYMENT",
  "FEE",
];

// Mock data switched off — the ledger screen falls through to its empty state
// until a real ledger endpoint replaces it. Restoring is mechanical: un-comment
// the block below and point transactions/client.tsx back at MOCK_SME_TRANSACTIONS.
/*
const PROJECT = "Công ty TNHH ABC Retail";
const INSTALMENT = 98_436_421;

export const MOCK_SME_TRANSACTIONS: Transaction[] = [
  {
    id: "sme-txn-0009",
    reference: "FL-RP-2026-0905",
    type: "REPAYMENT",
    status: "PENDING",
    created_at: "2026-09-05T09:00:00",
    amount: -INSTALMENT,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
  {
    id: "sme-txn-0008",
    reference: "FL-RP-2026-0805",
    type: "REPAYMENT",
    status: "COMPLETED",
    created_at: "2026-08-05T09:04:00",
    amount: -INSTALMENT,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
  {
    id: "sme-txn-0007",
    reference: "FL-ER-2026-0722",
    type: "EARLY_REPAYMENT",
    status: "COMPLETED",
    created_at: "2026-07-22T15:20:00",
    amount: -50_000_000,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
  {
    id: "sme-txn-0006",
    reference: "FL-RP-2026-0705",
    type: "REPAYMENT",
    status: "COMPLETED",
    created_at: "2026-07-05T09:02:00",
    amount: -INSTALMENT,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
  {
    id: "sme-txn-0005",
    reference: "FL-RP-2026-0605",
    type: "REPAYMENT",
    status: "FAILED",
    created_at: "2026-06-05T09:01:00",
    amount: -INSTALMENT,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
  {
    id: "sme-txn-0004",
    reference: "FL-RP-2026-0606",
    type: "REPAYMENT",
    status: "COMPLETED",
    created_at: "2026-06-06T11:12:00",
    amount: -INSTALMENT,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
  {
    id: "sme-txn-0003",
    reference: "FL-RP-2026-0505",
    type: "REPAYMENT",
    status: "COMPLETED",
    created_at: "2026-05-05T09:03:00",
    amount: -INSTALMENT,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
  {
    id: "sme-txn-0002",
    reference: "FL-FEE-2026-0402",
    type: "FEE",
    status: "COMPLETED",
    created_at: "2026-04-02T10:31:00",
    // Platform fee, deducted from the disbursement rather than invoiced —
    // the omnibus flow in CLAUDE.md takes it on the way through.
    amount: -12_000_000,
    currency: "VND",
    counterparty: "FundLok",
    method_key: "deductedFromDisbursement",
  },
  {
    id: "sme-txn-0001",
    reference: "FL-DB-2026-0402",
    type: "DISBURSEMENT",
    status: "COMPLETED",
    created_at: "2026-04-02T10:30:00",
    amount: 800_000_000,
    currency: "VND",
    counterparty: PROJECT,
    method_key: "businessAccount",
    method_ref: "••••4417",
  },
];
*/

export interface SmeTransactionSummary {
  /** Disbursed to the SME, VND. */
  disbursed: number;
  /** Repaid, including early repayments, VND. */
  repaid: number;
  /** Platform fees taken, VND. */
  fees: number;
  /** Instalments not yet settled. */
  pendingCount: number;
}

/**
 * Failed transfers never moved money, so they are excluded from the totals but
 * still listed in the table — same rule as the investor summary.
 */
export function summarizeSme(
  transactions: Transaction[],
): SmeTransactionSummary {
  return transactions
    .filter((txn) => txn.status !== "FAILED")
    .reduce<SmeTransactionSummary>(
      (acc, txn) => {
        if (txn.type === "DISBURSEMENT") acc.disbursed += txn.amount;
        else if (txn.type === "FEE") acc.fees += Math.abs(txn.amount);
        else if (txn.type === "REPAYMENT" || txn.type === "EARLY_REPAYMENT")
          acc.repaid += Math.abs(txn.amount);
        if (txn.status === "PENDING") acc.pendingCount += 1;
        return acc;
      },
      { disbursed: 0, repaid: 0, fees: 0, pendingCount: 0 },
    );
}
