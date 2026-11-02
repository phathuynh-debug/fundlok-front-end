import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransferReviewSheet } from "./TransferReviewSheet";
import type {
  AdminFundingActivity,
  AdminInvestorTransfer,
  AdminRepaymentPreview,
} from "@/services/admin-funding.service";

const decideMock = vi.fn();
let row: AdminInvestorTransfer;
let me = { id: "admin-1" };
let history: AdminFundingActivity[] = [];
let preview: AdminRepaymentPreview | undefined;

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => ({ data: me }),
}));
vi.mock("@/hooks/use-admin-funding", () => ({
  useAdminInvestorTransfer: () => ({
    data: row,
    isLoading: false,
    isError: false,
  }),
  useAdminReceiptUrl: () => ({ data: undefined, isLoading: false }),
  useAdminRepaymentReceiptUrl: () => ({ data: undefined, isLoading: false }),
  useAdminRepaymentPreview: () => ({ data: preview, isLoading: false }),
  useDecideReceipt: () => ({ mutate: decideMock, isPending: false }),
  useAdminFundingActivity: () => ({
    data: { items: history, total: history.length, page: 1, page_size: 50 },
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

const base: AdminInvestorTransfer = {
  id: "tr-1",
  window_id: "w-1",
  project_id: "p-1",
  project_name: "Delta Foods",
  investor_id: "inv-1",
  investor_email: "an@example.com",
  investor_full_name: "Nguyễn Văn An",
  amount_vnd: 10_000_000,
  reference_code: "FL8TKK1UAQ",
  status: "SIGNED",
  review_cause: null,
  void_reason: null,
  reserved_at: "2026-11-02T05:26:00Z",
  hold_expires_at: "2026-11-02T07:26:00Z",
  receipt_submitted_at: "2026-11-02T05:40:00Z",
  attested_at: null,
  confirmed_at: null,
  needs_action: true,
  transfer: {
    id: "tf-1",
    check_status: "AWAITING_FIELDS",
    failure_codes: [],
    parsed_fields: null,
    has_file: true,
    original_filename: "receipt.png",
    content_type: "image/png",
    created_at: "2026-11-02T05:40:00Z",
  },
  dispute: null,
  expected: {
    payee_bank_name: "VietinBank",
    payee_account_number: "123123123123",
    payee_account_name: "Huynh Tan Phat",
    payer_kyc_name: "Nguyễn Văn An",
  },
};

const open = () =>
  render(<TransferReviewSheet trancheId="tr-1" onOpenChange={vi.fn()} />);

describe("TransferReviewSheet", () => {
  beforeEach(() => {
    decideMock.mockReset();
    row = base;
    me = { id: "admin-1" };
    history = [];
    preview = undefined;
  });

  it("lets staff approve after looking at the receipt, typing nothing in", () => {
    open();

    // What to look for on the receipt, beside it; no fields to fill.
    expect(screen.getByText("123123123123")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("admin.transactions.fields.amount_vnd"),
    ).toBeNull();
    expect(
      screen.getByText("admin.transactions.sheet.receiptHint"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "admin.transactions.sheet.approve" }),
    );
    expect(decideMock).toHaveBeenCalledWith(
      { transferId: "tf-1", body: { outcome: "APPROVED", reason: null } },
      expect.anything(),
    );
  });

  it("lets staff settle a ticket left waiting for the business", () => {
    row = {
      ...base,
      status: "ATTESTED",
      transfer: { ...base.transfer!, check_status: "MATCHED" },
    };
    open();

    fireEvent.click(
      screen.getByRole("button", { name: "admin.transactions.sheet.approve" }),
    );
    expect(decideMock).toHaveBeenCalledWith(
      { transferId: "tf-1", body: { outcome: "APPROVED", reason: null } },
      expect.anything(),
    );
  });

  it("works out the repayment approving starts, beside the decision", () => {
    preview = {
      kind: "PREVIEW",
      assumed_close_date: "2026-11-02",
      start_date: "2026-11-03",
      business_day_count: 84,
      days: [
        {
          kind: "STUB",
          day_index: 0,
          due_date: "2026-11-03",
          principal_vnd: 0,
          interest_vnd: 2_976,
          gross_vnd: 2_976,
          tax_withheld_vnd: 148,
          net_vnd: 2_828,
        },
        {
          kind: "INSTALMENT",
          day_index: 1,
          due_date: "2026-11-03",
          principal_vnd: 119_048,
          interest_vnd: 2_975,
          gross_vnd: 122_023,
          tax_withheld_vnd: 148,
          net_vnd: 121_875,
        },
      ],
      totals: {
        gross_vnd: 10_252_976,
        tax_withheld_vnd: 12_648,
        net_vnd: 10_240_328,
      },
      basis: {
        principal_vnd: 10_000_000,
        loan_rate_pct: "16.000",
        investor_return_pct: "2.5",
        investor_rate_pct: "7.5",
        term_months: 4,
        working_days_per_month: 21,
        business_day_count: 84,
        interest_vnd: 250_000,
        total_vnd: 10_250_000,
        daily_vnd: 122_023,
        final_vnd: 122_091,
        received_on: "2026-11-02",
        approved_on: "2026-11-02",
        start_date: "2026-11-03",
        end_date: "2027-03-05",
        stub_days: 1,
        stub_basis_days: 252,
        stub_interest_vnd: 2_976,
        individual: true,
        withholding_pct: "5",
        tax_vnd: 12_648,
      },
    };
    open();

    const block = screen.getByTestId("repayment-preview");
    expect(block).toHaveTextContent(
      "admin.transactions.preview.headingPreview",
    );
    const steps = screen.getByTestId("repayment-preview-steps");
    // Approved today, it repays from the next working day.
    expect(steps).toHaveTextContent(
      'admin.transactions.preview.steps.datesPreview:{"approved":"11/02/2026","start":"11/03/2026","end":"03/05/2027"}',
    );
    // The return, the days, each day's amount, the first-period interest, the tax.
    expect(steps).toHaveTextContent('"return":"2.5","term":4,"rate":"7.5"');
    expect(steps).toHaveTextContent('"perMonth":21,"count":84');
    expect(steps).toHaveTextContent('"daily":"₫122,023","last":"₫122,091"');
    expect(steps).toHaveTextContent('"stub":"₫2,976"');
    expect(steps).toHaveTextContent('"amount":"₫12,648"');
    // Day one carries the first-period interest.
    expect(block).toHaveTextContent('"gross":"₫124,999","net":"₫124,703"');
  });

  it("denies with the note staff gave", () => {
    open();

    fireEvent.change(
      screen.getByLabelText("admin.transactions.sheet.notePlaceholder"),
      { target: { value: "Screenshot of another transfer" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "admin.transactions.sheet.deny" }),
    );
    expect(decideMock).toHaveBeenCalledWith(
      {
        transferId: "tf-1",
        body: { outcome: "DENIED", reason: "Screenshot of another transfer" },
      },
      expect.anything(),
    );
  });

  it("settles a ticket under review with the same approve / deny", () => {
    row = {
      ...base,
      status: "UNDER_REVIEW",
      transfer: {
        ...base.transfer!,
        check_status: "MISMATCH",
        failure_codes: ["AMOUNT_MISMATCH"],
        parsed_fields: {
          amount_vnd: 9_000_000,
          transferred_at: "2026-11-02T05:35:00Z",
          payer_name: "NGUYEN VAN AN",
          payer_account: "0123",
          payee_account: "123123123123",
          memo: "FL8TKK1UAQ",
          bank_txn_id: "FT1",
        },
      },
      dispute: {
        id: "d-1",
        cause: "RECEIPT_MISMATCH",
        status: "AWAITING_STAFF",
        outcome: null,
      },
    };
    open();

    // The test translator has no dictionary, so the label falls back to the code.
    expect(screen.getByText("AMOUNT_MISMATCH")).toBeInTheDocument();
    // No dictionary here, so the cause falls back to the general question.
    expect(
      screen.getByText("admin.transactions.sheet.decideBody"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("admin.transactions.sheet.reviewHint"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "admin.transactions.sheet.approve" }),
    );
    expect(decideMock).toHaveBeenCalledWith(
      { transferId: "tf-1", body: { outcome: "APPROVED", reason: null } },
      expect.anything(),
    );
  });

  it("does not let staff decide their own investment", () => {
    me = { id: "inv-1" };
    open();

    expect(
      screen.getByText("admin.transactions.sheet.ownTransfer"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "admin.transactions.sheet.approve",
      }),
    ).toBeNull();
  });

  it("shows the ticket's history: who did what, and why", () => {
    history = [
      {
        id: "a-2",
        action: "TRANSFER_NOT_RECEIVED",
        created_at: "2026-11-02T08:00:00Z",
        ip_address: null,
        actor: {
          id: "admin-2",
          full_name: "Le Minh",
          email: "minh@fundlok.com",
        },
        tranche_id: "tr-1",
        reference_code: "FL8TKK1UAQ",
        amount_vnd: 10_000_000,
        project_name: "Delta Foods",
        investor: null,
        check_status: null,
        failure_codes: [],
        tranche_status: null,
        reason: "Nothing on the statement",
      },
    ];
    open();

    const timeline = screen.getByTestId("transfer-history");
    expect(timeline).toHaveTextContent(
      "admin.transactions.activity.kinds.notReceived",
    );
    expect(timeline).toHaveTextContent("Nothing on the statement");
  });
});
