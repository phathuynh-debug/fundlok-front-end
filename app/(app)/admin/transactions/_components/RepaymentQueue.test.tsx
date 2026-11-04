import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RepaymentQueue } from "./RepaymentQueue";
import type { AdminRepaymentReceipt } from "@/services/admin-funding.service";

let items: AdminRepaymentReceipt[] = [];

vi.mock("@/hooks/use-admin-funding", () => ({
  useAdminRepaymentReceipts: () => ({
    data: { items, total: items.length, page: 1, page_size: 20 },
    isLoading: false,
    isFetching: false,
  }),
  useAdminRepaymentReceipt: (id: string | null) => ({
    data: items.find((item) => item.id === id),
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

const receipt1: AdminRepaymentReceipt = {
  id: "rc-1",
  tranche_id: "tr-1",
  window_id: "w-1",
  project_name: "CÔNG TY CỔ PHẦN FUNDLOK",
  reference_code: "FL8TKK1UAQ",
  tranche_amount_vnd: 30_000_000,
  tranche_paid_days: 2,
  tranche_total_days: 60,
  business: {
    id: "sme-1",
    full_name: "HUYNH TAN PHAT",
    email: "sme@fundlok.vn",
  },
  investor: { id: "inv-1", full_name: "Phat Huynh", email: "inv@fundlok.vn" },
  submitted_at: "2026-11-04T08:22:00Z",
  check_status: "MATCHED",
  needs_action: false,
  gross_vnd: 122_023,
  tax_withheld_vnd: 148,
  net_vnd: 121_875,
  days: [
    {
      repayment_day_id: "d-2",
      transfer_id: "tf-2",
      kind: "INSTALMENT",
      day_index: 2,
      due_date: "2026-11-04",
      principal_vnd: 119_048,
      interest_vnd: 2_975,
      gross_vnd: 122_023,
      tax_withheld_vnd: 148,
      net_vnd: 121_875,
      status: "MATCHED",
      check_status: "MATCHED",
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
  original_filename: "receipt2.png",
  content_type: "image/png",
  open_report: false,
};

const receipt2: AdminRepaymentReceipt = {
  ...receipt1,
  id: "rc-2",
  submitted_at: "2026-11-03T04:33:00Z",
  gross_vnd: 125_000,
  tax_withheld_vnd: 297,
  net_vnd: 124_703,
  days: [
    {
      repayment_day_id: "d-1",
      transfer_id: "tf-1",
      kind: "INSTALMENT",
      day_index: 1,
      due_date: "2026-11-03",
      principal_vnd: 119_048,
      interest_vnd: 5_952,
      gross_vnd: 125_000,
      tax_withheld_vnd: 297,
      net_vnd: 124_703,
      status: "MATCHED",
      check_status: "MATCHED",
    },
  ],
};

describe("RepaymentQueue", () => {
  beforeEach(() => {
    items = [receipt1, receipt2];
  });

  it("groups receipts by investment ticket and shows project, memo, principal, SME -> investor, and paid/total days progress", () => {
    render(<RepaymentQueue status="ALL" />);

    const groupRow = screen.getByTestId("investment-group-tr-1");
    expect(groupRow).toHaveTextContent("CÔNG TY CỔ PHẦN FUNDLOK");
    expect(groupRow).toHaveTextContent("FL8TKK1UAQ");
    expect(groupRow).toHaveTextContent("₫30,000,000");
    expect(groupRow).toHaveTextContent("HUYNH TAN PHAT");
    expect(groupRow).toHaveTextContent("Phat Huynh");
    expect(groupRow).toHaveTextContent(
      'admin.transactions.repayments.table.progressDays:{"paid":2,"total":60}',
    );
    // Total net transferred across both receipts in this investment (121,875 + 124,703 = 246,578)
    expect(groupRow).toHaveTextContent("₫246,578");

    // Both individual receipts are visible under the group by default
    expect(screen.getByTestId("repayment-row-rc-1")).toHaveTextContent(
      "₫121,875",
    );
    expect(screen.getByTestId("repayment-row-rc-2")).toHaveTextContent(
      "₫124,703",
    );

    // Clicking the investment row collapses its receipt rows
    fireEvent.click(groupRow);
    expect(screen.queryByTestId("repayment-row-rc-1")).toBeNull();

    // Clicking again expands them
    fireEvent.click(groupRow);
    expect(screen.getByTestId("repayment-row-rc-1")).toBeInTheDocument();
  });

  it("opens RepaymentReviewSheet when a receipt row is clicked", () => {
    render(<RepaymentQueue status="ALL" />);

    fireEvent.click(screen.getByTestId("repayment-row-rc-1"));
    expect(screen.getByTestId("repayment-review")).toHaveTextContent(
      "FL8TKK1UAQ",
    );
  });
});
