import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { AdminFeeInvoice } from "@/services/admin-funding.service";
import { FeeInvoiceSheet } from "./FeeInvoiceSheet";

const mockMarkPaid = vi.fn();
const mockToast = vi.fn();

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/hooks/use-admin-funding", () => ({
  useMarkFeeInvoicePaid: () => ({
    mutateAsync: mockMarkPaid,
    isPending: false,
  }),
}));

const unpaid: AdminFeeInvoice = {
  id: "inv-1",
  status: "ISSUED",
  is_overdue: false,
  invoice_number: "FL-2026-FLAB12CD34",
  reference_code: "FLAB12CD34",
  base_vnd: 50_000_000,
  fee_vnd: 1_500_000,
  vat_vnd: 150_000,
  late_fee_vnd: 0,
  total_vnd: 1_650_000,
  issued_at: "2026-11-12T03:00:00Z",
  due_at: "2026-11-19T03:00:00Z",
  paid_at: null,
  paid_bank_txn_id: null,
  window_id: "win-1",
  round_status: "REPAYING",
  project_id: "proj-1",
  project_name: "ABC Retail Co",
  sme_user_id: "sme-1",
  sme_email: "sme@example.vn",
  sme_full_name: "Nguyen Thuy Linh",
  investments: [
    {
      tranche_id: "t-1",
      investor_name: "Tran Van An",
      investor_email: "an@example.com",
      amount_vnd: 30_000_000,
      reference_code: "FLINV0001",
      confirmed_at: "2026-11-10T03:00:00Z",
    },
    {
      tranche_id: "t-2",
      investor_name: null,
      investor_email: "binh@example.com",
      amount_vnd: 20_000_000,
      reference_code: "FLINV0002",
      confirmed_at: "2026-11-11T03:00:00Z",
    },
  ],
  email_status: "SENT",
  emailed_at: "2026-11-12T03:01:00Z",
};

describe("FeeInvoiceSheet", () => {
  beforeEach(() => {
    mockMarkPaid.mockReset();
    mockToast.mockReset();
  });

  it("shows the investment package the fee is charged on", () => {
    render(
      <FeeInvoiceSheet
        invoice={unpaid}
        onOpenChange={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Tran Van An")).toBeTruthy();
    // No name on record: the email stands in.
    expect(within(dialog).getByText("binh@example.com")).toBeTruthy();
    expect(within(dialog).getAllByText("FLAB12CD34").length).toBeGreaterThan(0);
    expect(
      within(dialog).getByText("admin.transactions.fees.markHeading"),
    ).toBeTruthy();
  });

  it("needs a bank transaction and a note before marking paid", async () => {
    render(
      <FeeInvoiceSheet
        invoice={unpaid}
        onOpenChange={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "admin.transactions.fees.markSubmit",
        }),
      );
    });
    expect(screen.getByRole("alert").textContent).toBe(
      "admin.transactions.fees.required",
    );
    expect(mockMarkPaid).not.toHaveBeenCalled();
  });

  it("marks it paid with the bank transaction and note", async () => {
    const paid = {
      ...unpaid,
      status: "PAID" as const,
      paid_at: "2026-11-13T02:00:00Z",
      paid_bank_txn_id: "FT26316123456",
    };
    mockMarkPaid.mockResolvedValue(paid);
    const onUpdated = vi.fn();
    render(
      <FeeInvoiceSheet
        invoice={unpaid}
        onOpenChange={vi.fn()}
        onUpdated={onUpdated}
      />,
    );
    fireEvent.change(
      screen.getByLabelText("admin.transactions.fees.bankTxnLabel"),
      { target: { value: "  FT26316123456 " } },
    );
    fireEvent.change(
      screen.getByLabelText("admin.transactions.fees.reasonLabel"),
      { target: { value: "Seen on the statement" } },
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "admin.transactions.fees.markSubmit",
        }),
      );
    });
    expect(mockMarkPaid).toHaveBeenCalledWith({
      invoiceId: "inv-1",
      payload: {
        bank_txn_id: "FT26316123456",
        reason: "Seen on the statement",
      },
    });
    expect(onUpdated).toHaveBeenCalledWith(paid);
  });

  it("says why when the bank transaction already paid another invoice", async () => {
    mockMarkPaid.mockRejectedValue({ status: 409, code: "DUPLICATE_BANK_TXN" });
    render(
      <FeeInvoiceSheet
        invoice={unpaid}
        onOpenChange={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    fireEvent.change(
      screen.getByLabelText("admin.transactions.fees.bankTxnLabel"),
      { target: { value: "FT1" } },
    );
    fireEvent.change(
      screen.getByLabelText("admin.transactions.fees.reasonLabel"),
      { target: { value: "x" } },
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "admin.transactions.fees.markSubmit",
        }),
      );
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        description: "admin.transactions.fees.duplicateTxn",
      }),
    );
  });

  it("shows a paid fee as paid, with no form", () => {
    render(
      <FeeInvoiceSheet
        invoice={{
          ...unpaid,
          status: "PAID",
          paid_at: "2026-11-13T02:00:00Z",
          paid_bank_txn_id: "FT26316123456",
        }}
        onOpenChange={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    expect(
      screen.queryByText("admin.transactions.fees.markHeading"),
    ).toBeNull();
    expect(
      screen.getAllByText("admin.transactions.fees.statusPaid").length,
    ).toBeGreaterThan(0);
  });
});
