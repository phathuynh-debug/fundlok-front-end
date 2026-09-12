// Frontend-only sample data for /dashboard/transactions.
//
// This deliberately does NOT live in services/ and has no endpoint, service or
// React Query hook behind it: there is no backend transactions API yet, and a
// half-wired service would look like the real pipeline while returning
// fabricated numbers. Keeping it here, under the route that renders it, means
// the screen is honest about being a mockup and the swap later is mechanical:
// add TRANSACTION_ENDPOINTS -> transactions.service.ts -> hooks/use-transactions.ts,
// move the types below into that service, then delete MOCK_TRANSACTIONS and
// read `data` from the hook instead. formatAmount/summarize are presentation
// helpers with no mock in them and can move alongside the types unchanged.
//
// The shape below is what the UI needs, written the way the API is expected to
// return it (snake_case, ISO-8601 timestamps, minor-unit-free decimals) so the
// component code does not have to change when the real thing arrives.

export type TransactionType =
  | "INVESTMENT"
  | "RETURN"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "REPAYMENT"
  | "FEE"
  // Borrower-side movements. An SME never invests or receives a distribution;
  // it receives a disbursement and repays. See sme/mock-sme-transactions.ts.
  | "DISBURSEMENT"
  | "EARLY_REPAYMENT";

export type TransactionStatus = "COMPLETED" | "PENDING" | "FAILED";

export interface Transaction {
  id: string;
  /** Human-facing reference shown in the table and in receipts. */
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  /** ISO-8601. Rendered with formatDate/formatDateTime so vi gets DD/MM/YYYY. */
  created_at: string;
  /**
   * Signed: negative is money leaving the account (investments, withdrawals,
   * fees), positive is money arriving (returns, deposits, repayments). Storing
   * the sign rather than a separate direction flag keeps the summary maths a
   * plain sum.
   */
  amount: number;
  currency: "VND";
  /** Project or company the movement relates to; "—" for account-level items. */
  counterparty: string;
  /**
   * How the money moved, as an i18n key under
   * `dashboard.transactions.methods`. A key rather than a literal for two
   * reasons: the column was rendering untranslated English under the
   * Vietnamese locale, and free text here is how a named bank ends up on
   * screen. We never name a custodial bank — funds sit with custodial bank
   * partners, plural and unnamed (fundlok-domain §4).
   */
  method_key: string;
  /** Masked account reference shown after the method, e.g. "••••4417". */
  method_ref?: string;
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-0014",
    reference: "FL-2026-0814-A31",
    type: "RETURN",
    status: "PENDING",
    created_at: "2026-08-17T09:12:00",
    amount: 46250000,
    currency: "VND",
    counterparty: "TechStart Solutions",
    method_key: "custodialAccount",
  },
  {
    id: "txn-0013",
    reference: "FL-2026-0816-K02",
    type: "INVESTMENT",
    status: "COMPLETED",
    created_at: "2026-08-16T14:38:00",
    amount: -625000000,
    currency: "VND",
    counterparty: "Mekong Agri Export",
    method_key: "custodialAccount",
  },
  {
    id: "txn-0012",
    reference: "FL-2026-0812-B77",
    type: "DEPOSIT",
    status: "COMPLETED",
    created_at: "2026-08-12T08:05:00",
    amount: 1000000000,
    currency: "VND",
    counterparty: "—",
    method_key: "bankTransfer",
  },
  {
    id: "txn-0011",
    reference: "FL-2026-0809-C15",
    type: "RETURN",
    status: "COMPLETED",
    created_at: "2026-08-09T16:47:00",
    amount: 58012500,
    currency: "VND",
    counterparty: "GreenEnergy Corp",
    method_key: "custodialAccount",
  },
  {
    id: "txn-0010",
    reference: "FL-2026-0805-D42",
    type: "FEE",
    status: "COMPLETED",
    created_at: "2026-08-05T11:20:00",
    amount: -3000000,
    currency: "VND",
    counterparty: "—",
    method_key: "platformFee",
  },
  {
    id: "txn-0009",
    reference: "FL-2026-0803-E88",
    type: "WITHDRAWAL",
    status: "FAILED",
    created_at: "2026-08-03T19:03:00",
    amount: -200000000,
    currency: "VND",
    counterparty: "—",
    method_key: "bankTransfer",
  },
  {
    id: "txn-0008",
    reference: "FL-2026-0729-F09",
    type: "REPAYMENT",
    status: "COMPLETED",
    created_at: "2026-07-29T10:15:00",
    amount: 118750000,
    currency: "VND",
    counterparty: "BioMed Labs",
    method_key: "dailyRepayment",
  },
  {
    id: "txn-0007",
    reference: "FL-2026-0722-G64",
    type: "INVESTMENT",
    status: "COMPLETED",
    created_at: "2026-07-22T13:52:00",
    amount: -375000000,
    currency: "VND",
    counterparty: "BioMed Labs",
    method_key: "custodialAccount",
  },
  {
    id: "txn-0006",
    reference: "FL-2026-0718-H21",
    type: "RETURN",
    status: "COMPLETED",
    created_at: "2026-07-18T09:41:00",
    amount: 29506250,
    currency: "VND",
    counterparty: "TechStart Solutions",
    method_key: "custodialAccount",
  },
  {
    id: "txn-0005",
    reference: "FL-2026-0711-J55",
    type: "WITHDRAWAL",
    status: "COMPLETED",
    created_at: "2026-07-11T17:26:00",
    amount: -300000000,
    currency: "VND",
    counterparty: "—",
    method_key: "bankTransfer",
  },
  {
    id: "txn-0004",
    reference: "FL-2026-0703-L30",
    type: "INVESTMENT",
    status: "COMPLETED",
    created_at: "2026-07-03T12:09:00",
    amount: -500000000,
    currency: "VND",
    counterparty: "GreenEnergy Corp",
    method_key: "custodialAccount",
  },
  {
    id: "txn-0003",
    reference: "FL-2026-0628-M18",
    type: "FEE",
    status: "COMPLETED",
    created_at: "2026-06-28T15:33:00",
    amount: -2387500,
    currency: "VND",
    counterparty: "—",
    method_key: "platformFee",
  },
  {
    id: "txn-0002",
    reference: "FL-2026-0620-N73",
    type: "DEPOSIT",
    status: "COMPLETED",
    created_at: "2026-06-20T07:58:00",
    amount: 1500000000,
    currency: "VND",
    counterparty: "—",
    method_key: "bankTransfer",
  },
  {
    id: "txn-0001",
    reference: "FL-2026-0615-P44",
    type: "INVESTMENT",
    status: "COMPLETED",
    created_at: "2026-06-15T10:02:00",
    amount: -750000000,
    currency: "VND",
    counterparty: "TechStart Solutions",
    method_key: "custodialAccount",
  },
];

// Money formatting is shared with every other dashboard surface — see
// lib/format-currency.ts. Re-exported here so the transactions components keep
// importing from one place, rather than half of them switching import paths.
export { formatCurrency } from "@/lib/format-currency";
import { formatCurrency } from "@/lib/format-currency";

// Signed amounts render with an explicit +/- so an outflow is readable without
// relying on colour alone.
export function formatAmount(amount: number, locale?: string) {
  const formatted = formatCurrency(amount, locale);
  return amount < 0 ? `−${formatted}` : `+${formatted}`;
}

export interface TransactionSummary {
  totalIn: number;
  totalOut: number;
  net: number;
  pendingCount: number;
}

// Failed transactions never moved money, so they are excluded from the totals
// but still listed in the table.
export function summarize(transactions: Transaction[]): TransactionSummary {
  return transactions.reduce<TransactionSummary>(
    (acc, txn) => {
      if (txn.status === "PENDING") acc.pendingCount += 1;
      if (txn.status !== "COMPLETED") return acc;

      if (txn.amount >= 0) acc.totalIn += txn.amount;
      else acc.totalOut += Math.abs(txn.amount);
      acc.net += txn.amount;
      return acc;
    },
    { totalIn: 0, totalOut: 0, net: 0, pendingCount: 0 },
  );
}
