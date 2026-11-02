import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { RepaymentReviewSheet } from "./RepaymentReviewSheet";
import type { AdminRepaymentReceipt } from "@/services/admin-funding.service";

const decideMock = vi.fn();
let row: AdminRepaymentReceipt;
let me = { id: "admin-1" };

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => ({ data: me }),
}));
vi.mock("@/hooks/use-admin-funding", () => ({
  useAdminRepaymentReceipt: () => ({
    data: row,
    isLoading: false,
    isError: false,
  }),
  useAdminRepaymentReceiptUrl: () => ({ data: undefined, isLoading: false }),
  useAdminReceiptUrl: () => ({ data: undefined, isLoading: false }),
  useDecideRepaymentReceipt: () => ({ mutate: decideMock, isPending: false }),
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
    decideMock.mockReset();
    row = base;
    me = { id: "admin-1" };
  });

  it("shows what the receipt should show beside the days it pays, and approves", () => {
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

    fireEvent.click(
      screen.getByRole("button", { name: "admin.transactions.sheet.approve" }),
    );
    expect(decideMock).toHaveBeenCalledWith(
      { receiptId: "rc-1", body: { outcome: "APPROVED", reason: null } },
      expect.anything(),
    );
  });

  it("denies only with a note, since the business reads it", () => {
    open();
    const deny = screen.getByRole("button", {
      name: "admin.transactions.sheet.deny",
    });
    expect(deny).toBeDisabled();

    fireEvent.change(
      screen.getByLabelText(
        "admin.transactions.repayments.sheet.notePlaceholder",
      ),
      { target: { value: "The receipt shows 100,000" } },
    );
    fireEvent.click(deny);
    expect(decideMock).toHaveBeenCalledWith(
      {
        receiptId: "rc-1",
        body: { outcome: "DENIED", reason: "The receipt shows 100,000" },
      },
      expect.anything(),
    );
  });

  it("warns when the investor reported a day it pays as missing", () => {
    row = { ...base, open_report: true };
    open();

    expect(screen.getByTestId("repayment-review")).toHaveTextContent(
      "admin.transactions.repayments.sheet.reported",
    );
  });

  it("does not let staff decide a repayment they are part of", () => {
    me = { id: "sme-1" };
    open();

    expect(
      screen.getByText("admin.transactions.repayments.sheet.own"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "admin.transactions.sheet.approve",
      }),
    ).toBeNull();
  });

  it("says how a decided receipt went, with nothing left to do", () => {
    row = { ...base, check_status: "REJECTED", needs_action: false };
    open();

    expect(
      screen.getByText("admin.transactions.repayments.sheet.decided.REJECTED"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "admin.transactions.sheet.approve",
      }),
    ).toBeNull();
  });
});
