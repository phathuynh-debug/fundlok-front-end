import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InvestmentCard, repaymentSummary } from "./InvestmentCard";
import { RepaymentReceipts } from "./RepaymentReceipts";
import type { Tranche } from "@/services/funding.service";
import type {
  ProjectedSchedule,
  RepaymentReceipt,
  RepaymentRow,
} from "@/services/repayment.service";

const reportMock = vi.fn();
const confirmMock = vi.fn();
let schedule: RepaymentRow[] | undefined;
let projection: ProjectedSchedule | undefined;
let receipts: RepaymentReceipt[] | undefined;

vi.mock("@/hooks/use-repayment", () => ({
  useRepaymentSchedule: () => ({ data: schedule, isLoading: false }),
  useRepaymentProjection: () => ({ data: projection, isLoading: false }),
  useReportMissingDay: () => ({ mutate: reportMock, isPending: false }),
  useRepaymentReceipts: () => ({ data: receipts, isLoading: false }),
  useConfirmRepaymentReceipt: () => ({ mutate: confirmMock, isPending: false }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

const tranche = (over: Partial<Tranche> = {}): Tranche => ({
  id: "tr-1",
  window_id: "w-1",
  status: "ACTIVE",
  amount_vnd: 10_000_000,
  reference_code: "FL8TKK1UAQ",
  hold_expires_at: "2026-11-02T07:26:00Z",
  signed_at: null,
  attested_at: null,
  receipt_submitted_at: "2026-11-02T05:51:00Z",
  project_id: "p-1",
  project_name: "CÔNG TY CỔ PHẦN FUNDLOK",
  ...over,
});

const day = (over: Partial<RepaymentRow>): RepaymentRow => ({
  repayment_day_id: "d-1",
  tranche_id: "tr-1",
  kind: "INSTALMENT",
  investor_display: "P. H***",
  due_date: "2020-01-02",
  principal_vnd: 119_048,
  interest_vnd: 6_349,
  gross_vnd: 125_397,
  tax_withheld_vnd: 317,
  net_vnd: 125_080,
  status: "PRESUMED_PAID",
  report_deadline: "2020-01-06T17:00:00Z",
  payee: null,
  reference_code: "FL8TKK1UAQ",
  vietqr_payload: null,
  ...over,
});

beforeEach(() => {
  reportMock.mockReset();
  confirmMock.mockReset();
  schedule = undefined;
  projection = undefined;
  receipts = undefined;
});

describe("repaymentSummary", () => {
  it("counts what the business paid and finds the next day due", () => {
    const rows = [
      day({ repayment_day_id: "d-1", status: "MATCHED", net_vnd: 100 }),
      day({ repayment_day_id: "d-2", status: "PRESUMED_PAID", net_vnd: 100 }),
      day({ repayment_day_id: "d-3", status: "REPORTED_MISSED", net_vnd: 100 }),
      day({
        repayment_day_id: "d-4",
        status: "DUE",
        net_vnd: 100,
        due_date: "2099-01-01",
      }),
    ];
    const summary = repaymentSummary(rows);
    expect(summary.paid).toBe(200); // a day reported missing does not count
    expect(summary.total).toBe(400);
    expect(summary.next?.repayment_day_id).toBe("d-4");
  });
});

describe("InvestmentCard", () => {
  it("links back to the transfer while it is still awaited", () => {
    render(<InvestmentCard tranche={tranche({ status: "SIGNED" })} />);
    expect(
      screen.getByRole("link", {
        name: /dashboard\.investor\.investments\.continue/,
      }),
    ).toHaveAttribute("href", "/dashboard/invest?projectId=p-1");
  });

  it("shows what was repaid, and lets the investor report a day that never arrived", () => {
    schedule = [
      day({ repayment_day_id: "d-1" }),
      day({ repayment_day_id: "d-2", status: "DUE", due_date: "2099-01-01" }),
    ];
    render(<InvestmentCard tranche={tranche()} />);

    expect(screen.getByTestId("investment-card")).toHaveTextContent(
      "dashboard.investor.investments.received",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "dashboard.investor.investments.schedule",
      }),
    );
    const rows = within(screen.getByTestId("investment-schedule")).getAllByRole(
      "listitem",
    );
    // Each day: what reaches the investor, and the repayment tax included.
    expect(rows[0]).toHaveTextContent("₫125,080");
    expect(rows[0]).toHaveTextContent(
      'dashboard.investor.investments.inclTax:{"gross":"₫125,397"}',
    );
    // Only a day already due can be reported; next year's cannot.
    expect(
      within(rows[1]).queryByRole("button", {
        name: "dashboard.investor.investments.report",
      }),
    ).toBeNull();
    fireEvent.click(
      within(rows[0]).getByRole("button", {
        name: "dashboard.investor.investments.report",
      }),
    );
    fireEvent.change(
      screen.getByLabelText("dashboard.investor.investments.reportPlaceholder"),
      { target: { value: "Nothing arrived" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "dashboard.investor.investments.reportSend",
      }),
    );
    expect(reportMock).toHaveBeenCalledWith(
      { dayId: "d-1", statement: "Nothing arrived" },
      expect.anything(),
    );
  });

  it("shows the projected repayment of a received investment, as a range and not a promise", () => {
    projection = {
      assumed_close_date: "2026-11-13",
      start_date: "2026-11-16",
      business_day_count: 2,
      days: [
        {
          kind: "STUB",
          day_index: 0,
          due_date: "2026-11-16",
          principal_vnd: 0,
          interest_vnd: 50_000,
          gross_vnd: 50_000,
          tax_withheld_vnd: 2_500,
          net_vnd: 47_500,
        },
        {
          kind: "INSTALMENT",
          day_index: 1,
          due_date: "2026-11-16",
          principal_vnd: 100_000,
          interest_vnd: 2_000,
          gross_vnd: 102_000,
          tax_withheld_vnd: 100,
          net_vnd: 101_900,
        },
        {
          kind: "INSTALMENT",
          day_index: 2,
          due_date: "2026-11-17",
          principal_vnd: 100_000,
          interest_vnd: 2_002,
          gross_vnd: 102_002,
          tax_withheld_vnd: 101,
          net_vnd: 101_901,
        },
      ],
      totals: { gross_vnd: 254_002, tax_withheld_vnd: 2_701, net_vnd: 251_301 },
    };
    render(<InvestmentCard tranche={tranche({ status: "CONFIRMED" })} />);

    const block = screen.getByTestId("projected-repayments");
    expect(block).toHaveTextContent(
      "dashboard.investor.investments.projected.badge",
    );
    // The daily amount spans a range: never one bare figure.
    expect(block).toHaveTextContent('"low":"₫101,900","high":"₫101,901"');
    // What the investor receives after tax, beside the same with tax included.
    expect(block).toHaveTextContent(
      "dashboard.investor.investments.projected.perDayGross",
    );
    expect(block).toHaveTextContent('"low":"₫102,000","high":"₫102,002"');
    // The first payment carries the first-period interest too: 149,400 after tax.
    expect(block).toHaveTextContent("₫149,400");
    expect(block).toHaveTextContent("₫152,000");
    fireEvent.click(
      screen.getByRole("button", {
        name: "dashboard.investor.investments.projected.show",
      }),
    );
    expect(
      within(screen.getByTestId("projected-days")).getAllByRole("listitem"),
    ).toHaveLength(3);
  });
});

const receipt = (over: Partial<RepaymentReceipt> = {}): RepaymentReceipt => ({
  id: "rc-1",
  tranche_id: "tr-1",
  reference_code: "FL8TKK1UAQ",
  project_name: "CÔNG TY CỔ PHẦN FUNDLOK",
  submitted_at: "2026-11-16T03:00:00Z",
  status: "AWAITING_CONFIRMATION",
  confirmed_at: null,
  gross_vnd: 142_023,
  tax_withheld_vnd: 1_148,
  net_vnd: 140_875,
  days: [
    {
      repayment_day_id: "d-0",
      kind: "STUB",
      due_date: "2026-11-16",
      principal_vnd: 0,
      interest_vnd: 20_000,
      gross_vnd: 20_000,
      tax_withheld_vnd: 1_000,
      net_vnd: 19_000,
      status: "PRESUMED_PAID",
    },
    {
      repayment_day_id: "d-1",
      kind: "INSTALMENT",
      due_date: "2026-11-16",
      principal_vnd: 119_048,
      interest_vnd: 2_975,
      gross_vnd: 122_023,
      tax_withheld_vnd: 148,
      net_vnd: 121_875,
      status: "PRESUMED_PAID",
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
  ...over,
});

describe("RepaymentReceipts", () => {
  it("lists each repayment awaiting confirmation and confirms when Received is clicked", () => {
    receipts = [receipt()];
    render(<RepaymentReceipts />);

    const card = screen.getByTestId("repayment-receipt");
    expect(card).toHaveTextContent("CÔNG TY CỔ PHẦN FUNDLOK");
    expect(card).toHaveTextContent("FL8TKK1UAQ");
    expect(card).toHaveTextContent("₫140,875");
    expect(card).toHaveTextContent("19036789012");

    // Click Received and confirm in the dialog.
    fireEvent.click(
      within(card).getByRole("button", {
        name: "dashboard.investor.investments.receipts.receivedBtn",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "dashboard.investor.investments.receipts.confirmAction",
      }),
    );
    expect(confirmMock).toHaveBeenCalledWith("rc-1", expect.anything());
  });

  it("notes when confirming closes an open missing-payment report", () => {
    receipts = [receipt({ open_report: true })];
    render(<RepaymentReceipts />);

    const card = screen.getByTestId("repayment-receipt");
    expect(card).toHaveTextContent(
      "dashboard.investor.investments.receipts.openReport",
    );
  });
});
