import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RepaymentReviewSheet } from "./RepaymentReviewSheet";
import type { AdminRepaymentReceipt } from "@/services/admin-funding.service";

let row: AdminRepaymentReceipt;

vi.mock("@/hooks/use-admin-funding", () => ({
  useAdminRepaymentReceipt: () => ({
    data: row,
    isLoading: false,
    isError: false,
  }),
  useAdminRepaymentReceiptUrl: () => ({ data: undefined, isLoading: false }),
  useAdminReceiptUrl: () => ({ data: undefined, isLoading: false }),
  useAdminFundingActivity: () => ({
    data: { items: [], total: 0, page: 1, page_size: 50 },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

const base: AdminRepaymentReceipt = {
  id: "rc-1",
  tranche_id: "tr-1",
  window_id: "w-1",
  project_name: "CÔNG TY CỔ PHẦN FUNDLOK",
  reference_code: "FL8TKK1UAQ",
  business: { id: "sme-1", full_name: "Lê Minh", email: "sme@example.com" },
  investor: { id: "inv-1", full_name: "Phát Huỳnh", email: "an@example.com" },
  submitted_at: "2026-11-16T03:00:00Z",
  check_status: "AWAITING_FIELDS",
  needs_action: true,
  gross_vnd: 142_023,
  tax_withheld_vnd: 1_148,
  net_vnd: 140_875,
  days: [
    {
      repayment_day_id: "d-0",
      transfer_id: "tf-0",
      kind: "STUB",
      due_date: "2026-11-16",
      principal_vnd: 0,
      interest_vnd: 20_000,
      gross_vnd: 20_000,
      tax_withheld_vnd: 1_000,
      net_vnd: 19_000,
      status: "PRESUMED_PAID",
      check_status: "AWAITING_FIELDS",
    },
    {
      repayment_day_id: "d-1",
      transfer_id: "tf-1",
      kind: "INSTALMENT",
      due_date: "2026-11-16",
      principal_vnd: 119_048,
      interest_vnd: 2_975,
      gross_vnd: 122_023,
      tax_withheld_vnd: 148,
      net_vnd: 121_875,
      status: "PRESUMED_PAID",
      check_status: "AWAITING_FIELDS",
    },
  ],
  payee: {
    bank_name: "Techcombank",
    account_number: "19036789012",
    account_name: "HUYNH TAN PHAT",
  },
  payer: {
    bank_name: "VietinBank",
    account_number: "123123123123",
    account_name: "CONG TY FUNDLOK",
  },
  original_filename: "receipt.png",
  content_type: "image/png",
  open_report: false,
};

const open = () =>
  render(<RepaymentReviewSheet receiptId="rc-1" onOpenChange={vi.fn()} />);

describe("RepaymentReviewSheet", () => {
  beforeEach(() => {
    row = base;
  });

  it("shows what the receipt should show beside the days it pays, as read-only", () => {
    open();

    const review = screen.getByTestId("repayment-review");
    // The amount the investor should receive, to their account, with the memo.
    expect(review).toHaveTextContent("₫140,875");
    expect(review).toHaveTextContent("19036789012");
    expect(review).toHaveTextContent("HUYNH TAN PHAT");
    expect(review).toHaveTextContent("FL8TKK1UAQ");
    expect(
      within(screen.getByTestId("repayment-review-days")).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(2);
    expect(
      screen.getByText("admin.transactions.repayments.sheet.awaitingInvestor"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "admin.transactions.sheet.approve",
      }),
    ).toBeNull();
  });

  it("warns when the investor reported a day it pays as missing", () => {
    row = { ...base, open_report: true };
    open();

    expect(screen.getByTestId("repayment-review")).toHaveTextContent(
      "admin.transactions.repayments.sheet.reported",
    );
  });

  it("shows the system's reading of the receipt, with the investor and the business compared", () => {
    row = {
      ...base,
      system_check: {
        verdict: "ACCEPTED",
        applied: false,
        suggested: "ACCEPTED",
        summary: "Read automatically: it matches",
        failure_codes: [],
        review_reasons: [],
        receiver: {
          bank_read: "Techcombank",
          bank_identified: "Techcombank",
          bank_identified_bin: "970407",
          expected_bank: "Techcombank",
          expected_bank_bin: "970407",
          account_read: "19036789012",
          expected_account: "19036789012",
          holder_read: "HUYNH TAN PHAT",
          expected_holder: "HUYNH TAN PHAT",
        },
        payer: {
          holder_read: "CTY FUNDLOK",
          expected_holder: "CONG TY FUNDLOK",
          expected_account: "123123123123",
        },
        decided_at: "2026-11-16T03:00:05Z",
        engine: "tesseract:vie+eng:psm6",
        confidence: 93,
        fields: {
          amount_vnd: 140_875,
          transferred_at: "2026-11-16T02:58:00Z",
          payer_name: "CTY FUNDLOK",
          payer_account: "123123123123",
          payee_account: "19036789012",
          payee_name: "HUYNH TAN PHAT",
          payee_bank: "Techcombank",
          memo: "FL8TKK1UAQ tra no",
          bank_txn_id: "FT2632012345",
        },
        field_confidence: {},
        notes: [],
        awaiting_review: false,
        reviewable: false,
        reviewed_at: null,
        reviewed_by: null,
        review_outcome: null,
        review_reason: null,
        overrides_system: null,
      },
    };
    open();

    const check = screen.getByTestId("system-check");
    // A match only advises: the investor still confirms.
    expect(check).toHaveTextContent(
      "admin.transactions.system.repayment.verdict.ACCEPTED",
    );
    expect(check).toHaveTextContent(
      "admin.transactions.system.repayment.acceptedBody",
    );
    expect(check).toHaveTextContent(
      "admin.transactions.system.repayment.investorAccount",
    );
    expect(within(check).getByTestId("receiver-holder")).toHaveAttribute(
      "data-match",
      "ok",
    );
    expect(within(check).getByTestId("payer-holder")).toHaveAttribute(
      "data-match",
      "ok",
    );
    expect(check).toHaveTextContent("CONG TY FUNDLOK");
    // Nothing for staff to decide here.
    expect(
      screen.getByText("admin.transactions.repayments.sheet.awaitingInvestor"),
    ).toBeInTheDocument();
  });

  it("shows no system check for a receipt that was not read", () => {
    open();
    expect(screen.queryByTestId("system-check")).toBeNull();
  });

  it("says how a decided receipt went, with nothing left to do", () => {
    row = { ...base, check_status: "MATCHED", needs_action: false };
    open();

    expect(
      screen.getByText("admin.transactions.repayments.sheet.decided.MATCHED"),
    ).toBeInTheDocument();
  });
});
