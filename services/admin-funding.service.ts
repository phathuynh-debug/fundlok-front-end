import { apiClient } from "@/lib/api-client";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import type { AdminTable } from "@/services/admin.service";
import type { FundingWindow, TrancheStatus } from "@/services/funding.service";
import type {
  ProjectedSchedule,
  ProjectionBasis,
} from "@/services/repayment.service";

// The admin Transactions tab (backend app/admin/funding.py): the funding rounds
// taking investment, and every investor transfer with the receipt checks staff
// do by hand. There is no bank feed (ADR-009), so a person reads each receipt.

export type AdminRoundFilter = "OPEN" | "ALL";

// Mirrors backend AdminFundingRoundOut.
export interface AdminFundingRound extends FundingWindow {
  project_id: string;
  project_name: string;
  sme_email: string;
  sme_full_name: string | null;
  /** Tickets waiting on staff: a receipt to read or a review to decide. */
  needs_action: number;
  /** The round's service fee, once it closed. Optional: older backends omit it. */
  fee_invoice?: AdminRoundFee | null;
}

// --------------------------------------------------------------------------- //
// Service fees: the SME's 3% (+ VAT) platform fee on each closed round. Mirrors
// backend app/admin/fee_schemas.py.
// --------------------------------------------------------------------------- //
export type FeeInvoiceStatus = "ISSUED" | "PAID" | "OVERDUE" | "VOID";
export const FEE_INVOICE_FILTERS = ["UNPAID", "PAID", "ALL"] as const;
export type FeeInvoiceFilter = (typeof FEE_INVOICE_FILTERS)[number];

export interface AdminRoundFee {
  id: string;
  status: FeeInvoiceStatus;
  total_vnd: number;
  due_at: string;
  /** Unpaid past its due date (computed: the overdue job is not running). */
  is_overdue: boolean;
}

/** One investment in the package the fee is charged on. */
export interface AdminFeeInvestment {
  tranche_id: string;
  investor_name: string | null;
  investor_email: string;
  amount_vnd: number;
  reference_code: string;
  confirmed_at: string | null;
}

export interface AdminFeeInvoice {
  id: string;
  status: FeeInvoiceStatus;
  is_overdue: boolean;
  invoice_number: string;
  /** The memo the SME puts on its transfer. */
  reference_code: string;
  base_vnd: number;
  fee_vnd: number;
  vat_vnd: number;
  late_fee_vnd: number;
  total_vnd: number;
  issued_at: string;
  due_at: string;
  paid_at: string | null;
  paid_bank_txn_id: string | null;
  window_id: string;
  round_status: string;
  project_id: string;
  project_name: string;
  sme_user_id: string;
  sme_email: string;
  sme_full_name: string | null;
  /** The investments whose confirmed total (base_vnd) the 3% is on. */
  investments: AdminFeeInvestment[];
  /** Whether the invoice email reached the SME. */
  email_status: "SENDING" | "SENT" | "FAILED" | null;
  emailed_at: string | null;
}

export interface MarkFeePaidPayload {
  bank_txn_id: string;
  reason: string;
}

/** NEEDS_ACTION is the queue; the others group the ticket states. */
export const TRANSFER_FILTERS = [
  "ALL",
  "NEEDS_ACTION",
  "AWAITING_TRANSFER",
  "RECEIVED",
  "ENDED",
] as const;
export type AdminTransferFilter = (typeof TRANSFER_FILTERS)[number];

export interface AdminTransferListParams {
  status: AdminTransferFilter;
  window_id?: string;
  page: number;
  page_size: number;
}

/** What staff typed from the receipt (backend ReceiptFields.to_json). */
export interface AdminReceiptFields {
  amount_vnd: number | null;
  transferred_at: string | null;
  payer_name: string | null;
  payer_account: string | null;
  payee_account: string | null;
  memo: string | null;
  bank_txn_id: string | null;
}

export type TransferCheckStatus =
  "AWAITING_FIELDS" | "MATCHED" | "MISMATCH" | "REJECTED" | "DUE";

export interface AdminTransferReceipt {
  id: string;
  check_status: TransferCheckStatus;
  /** e.g. AMOUNT_MISMATCH, MISSING_FIELD:memo. Empty when it matched. */
  failure_codes: string[];
  parsed_fields: AdminReceiptFields | null;
  has_file: boolean;
  original_filename: string | null;
  content_type: string | null;
  created_at: string | null;
}

export interface AdminTransferReview {
  id: string;
  /** RECEIPT_MISMATCH, LATE_RECEIPT, or the business disputing it. */
  cause: string;
  status: string;
  outcome: "RECEIVED" | "NOT_RECEIVED" | null;
  statement?: string | null;
  created_at?: string | null;
}

/** What a matching receipt shows. */
export interface AdminTransferExpected {
  payee_bank_name: string | null;
  payee_account_number: string | null;
  payee_account_name: string | null;
  payer_kyc_name: string;
}

// Mirrors backend AdminInvestorTransferOut: one investor ticket.
export interface AdminInvestorTransfer {
  id: string;
  window_id: string;
  project_id: string;
  project_name: string;
  investor_id: string;
  investor_email: string;
  investor_full_name: string | null;
  amount_vnd: number;
  /** The payment memo the investor's transfer must carry. */
  reference_code: string;
  status: TrancheStatus;
  review_cause: string | null;
  void_reason: string | null;
  reserved_at: string;
  hold_expires_at: string;
  receipt_submitted_at: string | null;
  attested_at: string | null;
  confirmed_at: string | null;
  needs_action: boolean;
  transfer: AdminTransferReceipt | null;
  dispute: AdminTransferReview | null;
  expected: AdminTransferExpected;
}

export interface AdminReceiptUrl {
  url: string;
  expires_in: number;
  content_type: string;
  original_filename: string | null;
}

/** A note is optional; an empty one records that staff viewed the receipt. */
export interface AdminReceiptDecisionPayload {
  outcome: "APPROVED" | "DENIED";
  reason: string | null;
}

/** DECISIONS: receipts checked or rejected, reviews settled, investors' and
 *  businesses' alike. INVESTOR: reservations and uploads. BUSINESS:
 *  repayments marked paid. VIEWS: who opened which receipt. */
export const ACTIVITY_GROUPS = [
  "DECISIONS",
  "INVESTOR",
  "BUSINESS",
  "VIEWS",
  "ALL",
] as const;
export type AdminActivityGroup = (typeof ACTIVITY_GROUPS)[number];

export interface AdminActivityParams {
  group: AdminActivityGroup;
  /** One ticket's history (the review panel). */
  tranche_id?: string;
  page: number;
  page_size: number;
}

export interface AdminActivityPerson {
  id: string;
  full_name: string | null;
  email: string | null;
}

// Mirrors backend AdminFundingActivityOut: one audit-log entry.
export interface AdminFundingActivity {
  id: string;
  action: string;
  created_at: string | null;
  ip_address: string | null;
  /** Who did it; null for an action no signed-in person took. */
  actor: AdminActivityPerson | null;
  tranche_id: string | null;
  reference_code: string | null;
  amount_vnd: number | null;
  project_name: string | null;
  investor: AdminActivityPerson | null;
  /** With a receipt check: MATCHED, MISMATCH or REJECTED. */
  check_status: string | null;
  failure_codes: string[];
  tranche_status: string | null;
  /** The note staff gave. */
  reason: string | null;
}

// Mirrors backend AdminRepaymentPreviewOut. PREVIEW: the days an investment
// gets if approved today (from the next working day). ACTUAL: the days it got.
export interface AdminRepaymentPreview extends ProjectedSchedule {
  kind: "PREVIEW" | "ACTUAL";
  basis: ProjectionBasis;
}

/** NEEDS_ACTION is the queue: a receipt waiting on staff. */
export const REPAYMENT_FILTERS = ["NEEDS_ACTION", "DECIDED", "ALL"] as const;
export type AdminRepaymentFilter = (typeof REPAYMENT_FILTERS)[number];

export interface AdminRepaymentListParams {
  status: AdminRepaymentFilter;
  page: number;
  page_size: number;
}

export interface AdminRepaymentAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

/** One day a business's receipt pays. */
export interface AdminRepaymentDay {
  repayment_day_id: string;
  transfer_id: string;
  kind: "INSTALMENT" | "STUB";
  day_index?: number;
  due_date: string;
  principal_vnd: number;
  interest_vnd: number;
  gross_vnd: number;
  tax_withheld_vnd: number;
  net_vnd: number;
  status: "DUE" | "PRESUMED_PAID" | "REPORTED_MISSED" | "MATCHED";
  check_status: string;
}

// Mirrors backend AdminRepaymentReceiptOut: a receipt the business uploaded
// for repaying one investor, and the days it pays.
export interface AdminRepaymentReceipt {
  /** The receipt file. */
  id: string;
  tranche_id: string;
  window_id: string;
  project_name: string;
  /** The memo the business's transfer must carry. */
  reference_code: string;
  /** The investor's principal in this ticket. */
  tranche_amount_vnd?: number;
  /** Working days marked paid or confirmed on this ticket. */
  tranche_paid_days?: number;
  /** Total working days in this ticket's schedule. */
  tranche_total_days?: number;
  business: AdminActivityPerson;
  investor: AdminActivityPerson;
  submitted_at: string;
  /** AWAITING_FIELDS: waits on the investor's confirmation; MATCHED: the
   *  investor confirmed it (or staff approved it, before investors
   *  confirmed); REJECTED: staff denied it, before investors confirmed. */
  check_status: "AWAITING_FIELDS" | "MATCHED" | "REJECTED";
  /** Still waiting on the investor. Staff only read; they do not decide. */
  needs_action: boolean;
  gross_vnd: number;
  tax_withheld_vnd: number;
  /** What the receipt should show: the amount transferred. */
  net_vnd: number;
  days: AdminRepaymentDay[];
  /** The investor's account the money should reach. */
  payee: AdminRepaymentAccount | null;
  /** The business's account. */
  payer: AdminRepaymentAccount | null;
  original_filename: string | null;
  content_type: string | null;
  /** The investor reported one of these days as never arriving. */
  open_report: boolean;
  /** Days on this ticket the business has not marked paid after their due
   *  date (counted by due date), and what it owes for them. */
  tranche_overdue_days?: number;
  tranche_overdue_net_vnd?: number;
  tranche_oldest_overdue_date?: string | null;
  /** Working days since the oldest late day (that day included). */
  tranche_working_days_late?: number;
}

// Mirrors backend AdminOverdueRepaymentOut: one investor ticket the business
// is late repaying (days still not marked paid after their due date).
export interface AdminOverdueRepayment {
  tranche_id: string;
  window_id: string;
  project_name: string;
  reference_code: string;
  business: AdminActivityPerson;
  investor: AdminActivityPerson;
  /** Late days, counted by due date. */
  overdue_days: number;
  oldest_due_date: string;
  /** Working days since the oldest late day: due Monday and unpaid on
   *  Tuesday is 1. */
  working_days_late: number;
  /** What the business owes the investor for them (net of tax). */
  overdue_net_vnd: number;
}

// Mirrors backend AdminOverdueRepaymentsOut: every late repayment as of
// `as_of` (today, ICT), most working days late first.
export interface AdminOverdueRepayments {
  as_of: string;
  tickets: number;
  businesses: number;
  overdue_days: number;
  overdue_net_vnd: number;
  items: AdminOverdueRepayment[];
}

export const adminFundingService = {
  listRounds(status: AdminRoundFilter) {
    return apiClient.get<AdminFundingRound[]>(ADMIN_ENDPOINTS.fundingRounds, {
      params: { status },
    });
  },

  // Does what is due on a round now; audited.
  listFeeInvoices(status: FeeInvoiceFilter) {
    return apiClient.get<AdminFeeInvoice[]>(ADMIN_ENDPOINTS.feeInvoices, {
      params: { status },
    });
  },

  markFeeInvoicePaid(invoiceId: string, payload: MarkFeePaidPayload) {
    return apiClient.post<AdminFeeInvoice>(
      ADMIN_ENDPOINTS.feeInvoiceMarkPaid(invoiceId),
      payload,
    );
  },

  advanceRound(windowId: string) {
    return apiClient.post<AdminFundingRound>(
      ADMIN_ENDPOINTS.fundingRoundAdvance(windowId),
    );
  },

  listTransfers(params: AdminTransferListParams) {
    return apiClient.get<AdminTable<AdminInvestorTransfer>>(
      ADMIN_ENDPOINTS.fundingTransfers,
      { params },
    );
  },

  listActivity(params: AdminActivityParams) {
    return apiClient.get<AdminTable<AdminFundingActivity>>(
      ADMIN_ENDPOINTS.fundingActivity,
      { params },
    );
  },

  getTransfer(trancheId: string) {
    return apiClient.get<AdminInvestorTransfer>(
      ADMIN_ENDPOINTS.fundingTransfer(trancheId),
    );
  },

  // The repayment approving starts, worked out step by step.
  getRepaymentPreview(trancheId: string) {
    return apiClient.get<AdminRepaymentPreview>(
      ADMIN_ENDPOINTS.fundingTransferRepayment(trancheId),
    );
  },

  // A 10-minute link; each call is audited, so it is fetched on demand.
  getReceiptUrl(transferId: string) {
    return apiClient.get<AdminReceiptUrl>(
      ADMIN_ENDPOINTS.transferReceiptUrl(transferId),
    );
  },

  // Approve or deny after looking at the receipt; settles a review too.
  decide(transferId: string, body: AdminReceiptDecisionPayload) {
    return apiClient.post<AdminInvestorTransfer>(
      ADMIN_ENDPOINTS.transferDecision(transferId),
      body,
    );
  },

  listRepayments(params: AdminRepaymentListParams) {
    return apiClient.get<AdminTable<AdminRepaymentReceipt>>(
      ADMIN_ENDPOINTS.fundingRepayments,
      { params },
    );
  },

  listOverdueRepayments() {
    return apiClient.get<AdminOverdueRepayments>(
      ADMIN_ENDPOINTS.fundingRepaymentsOverdue,
    );
  },

  getRepayment(receiptId: string) {
    return apiClient.get<AdminRepaymentReceipt>(
      ADMIN_ENDPOINTS.fundingRepayment(receiptId),
    );
  },

  // A 10-minute link; each call is audited, so it is fetched on demand.
  getRepaymentReceiptUrl(receiptId: string) {
    return apiClient.get<AdminReceiptUrl>(
      ADMIN_ENDPOINTS.repaymentReceiptUrl(receiptId),
    );
  },
};
