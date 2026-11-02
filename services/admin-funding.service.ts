import { apiClient } from "@/lib/api-client";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import type { AdminTable } from "@/services/admin.service";
import type { FundingWindow, TrancheStatus } from "@/services/funding.service";

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

/** Leave a field blank (null) when the receipt does not show it. */
export interface AdminReceiptFieldsPayload {
  amount_vnd: number;
  /** ISO 8601 with an offset. */
  transferred_at: string;
  payer_name: string | null;
  payer_account: string | null;
  payee_account: string | null;
  memo: string | null;
  bank_txn_id: string | null;
  reason: string;
}

export interface AdminTransferDecisionPayload {
  outcome: "RECEIVED" | "NOT_RECEIVED";
  reason: string;
}

/** DECISIONS: receipts checked or rejected, reviews settled. INVESTOR:
 *  reservations and uploads. VIEWS: who opened which receipt. */
export const ACTIVITY_GROUPS = [
  "DECISIONS",
  "INVESTOR",
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

export const adminFundingService = {
  listRounds(status: AdminRoundFilter) {
    return apiClient.get<AdminFundingRound[]>(ADMIN_ENDPOINTS.fundingRounds, {
      params: { status },
    });
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

  // A 10-minute link; each call is audited, so it is fetched on demand.
  getReceiptUrl(transferId: string) {
    return apiClient.get<AdminReceiptUrl>(
      ADMIN_ENDPOINTS.transferReceiptUrl(transferId),
    );
  },

  enterFields(transferId: string, body: AdminReceiptFieldsPayload) {
    return apiClient.post<AdminInvestorTransfer>(
      ADMIN_ENDPOINTS.transferFields(transferId),
      body,
    );
  },

  decide(reviewId: string, body: AdminTransferDecisionPayload) {
    return apiClient.post<AdminInvestorTransfer>(
      ADMIN_ENDPOINTS.transferDecision(reviewId),
      body,
    );
  },
};
