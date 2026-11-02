import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransferReviewSheet } from "./TransferReviewSheet";
import type {
  AdminFundingActivity,
  AdminInvestorTransfer,
} from "@/services/admin-funding.service";

const enterMock = vi.fn();
const decideMock = vi.fn();
let row: AdminInvestorTransfer;
let me = { id: "admin-1" };
let history: AdminFundingActivity[] = [];

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
  useEnterTransferFields: () => ({ mutate: enterMock, isPending: false }),
  useDecideTransfer: () => ({ mutate: decideMock, isPending: false }),
  useAdminFundingActivity: () => ({
    data: { items: history, total: history.length, page: 1, page_size: 50 },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({ locale: "en", t: (key: string) => key }),
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
    enterMock.mockReset();
    decideMock.mockReset();
    row = base;
    me = { id: "admin-1" };
    history = [];
  });

  it("asks staff to type what the receipt shows, with nothing prefilled", () => {
    open();

    expect(screen.getByText("123123123123")).toBeInTheDocument();
    const amount = screen.getByLabelText(
      "admin.transactions.fields.amount_vnd",
    );
    expect(amount).toHaveValue("");
    const submit = screen.getByRole("button", {
      name: "admin.transactions.sheet.check",
    });
    expect(submit).toBeDisabled();

    fireEvent.change(amount, { target: { value: "10.000.000" } });
    fireEvent.change(
      screen.getByLabelText("admin.transactions.fields.transferred_at"),
      { target: { value: "2026-11-02T12:35" } },
    );
    fireEvent.change(screen.getByLabelText("admin.transactions.fields.memo"), {
      target: { value: "FL8TKK1UAQ chuyen tien" },
    });
    fireEvent.change(screen.getByLabelText("admin.transactions.sheet.note"), {
      target: { value: "Read from the receipt" },
    });
    fireEvent.click(submit);

    expect(enterMock).toHaveBeenCalledOnce();
    const [{ transferId, body }] = enterMock.mock.calls[0];
    expect(transferId).toBe("tf-1");
    expect(body.amount_vnd).toBe(10_000_000);
    expect(body.memo).toBe("FL8TKK1UAQ chuyen tien");
    expect(body.payer_name).toBeNull(); // left blank: the checks will flag it
    expect(body.transferred_at).toMatch(/Z$/);
  });

  it("shows what did not match and asks whether the money arrived", () => {
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
    const received = screen.getByRole("button", {
      name: "admin.transactions.sheet.received",
    });
    expect(received).toBeDisabled(); // a reason is required

    fireEvent.change(
      screen.getByLabelText("admin.transactions.sheet.decisionPlaceholder"),
      { target: { value: "Bank statement shows it" } },
    );
    fireEvent.click(received);
    expect(decideMock).toHaveBeenCalledWith(
      {
        reviewId: "d-1",
        body: { outcome: "RECEIVED", reason: "Bank statement shows it" },
      },
      expect.anything(),
    );
  });

  it("does not let staff check their own investment", () => {
    me = { id: "inv-1" };
    open();

    expect(
      screen.getByText("admin.transactions.sheet.ownTransfer"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "admin.transactions.sheet.check" }),
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
