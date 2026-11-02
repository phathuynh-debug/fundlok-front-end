import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import RepaymentClient from "./client";
import type { SmeRound, SmeTicket } from "@/services/funding.service";
import type {
  InvestmentDue,
  ProjectedSchedule,
  RepaymentRow,
} from "@/services/repayment.service";

const payMock = vi.fn();
let rounds: SmeRound[] = [];
let schedule: RepaymentRow[] | undefined;
let projection: ProjectedSchedule | undefined;
let due: InvestmentDue | undefined;

vi.mock("@/hooks/use-authentication", () => ({
  useRequireAuth: () => ({ user: { id: "sme-1" }, isLoading: false }),
}));
vi.mock("@/hooks/use-funding", () => ({
  useMyRounds: () => ({ data: rounds, isLoading: false }),
}));
vi.mock("@/hooks/use-repayment", () => ({
  useRepaymentSchedule: () => ({ data: schedule, isLoading: false }),
  useRepaymentProjection: () => ({ data: projection, isLoading: false }),
  useInvestmentDue: () => ({ data: due, isLoading: false }),
  usePayWithReceipt: () => ({ mutate: payMock, isPending: false }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

const ticket = (over: Partial<SmeTicket> = {}): SmeTicket => ({
  id: "tr-1",
  amount_vnd: 10_000_000,
  status: "ACTIVE",
  reference_code: "FL8TKK1UAQ",
  investor_display: "P. H***",
  attested_at: "2026-11-02T06:00:00Z",
  confirm_deadline: null,
  review_cause: null,
  ...over,
});

const round = (tickets: SmeTicket[]): SmeRound => ({
  id: "w-1",
  listing_id: "l-1",
  status: "OPEN",
  target_vnd: 50_000_000,
  min_raise_vnd: 25_000_000,
  min_ticket_vnd: 10_000_000,
  confirmed_vnd: 10_000_000,
  reserved_vnd: 0,
  capacity_vnd: 40_000_000,
  annual_rate_pct: "16.000",
  term_months: 4,
  window_start: "2026-10-30T00:00:00Z",
  window_end: "2026-11-13T00:00:00Z",
  days_left: 11,
  tranche_count: 1,
  closing_started_at: null,
  close_wait_until: null,
  repayment_start_date: null,
  project_id: "p-1",
  project_name: "CÔNG TY CỔ PHẦN FUNDLOK",
  tickets,
});

const payee = {
  bank_name: "Techcombank",
  bank_bin: "970407",
  account_number: "19036789012",
  account_name: "HUYNH TAN PHAT",
};

const row = (over: Partial<RepaymentRow>): RepaymentRow => ({
  repayment_day_id: "d-1",
  tranche_id: "tr-1",
  kind: "INSTALMENT",
  investor_display: "P. H***",
  due_date: "2020-01-02",
  principal_vnd: 119_048,
  interest_vnd: 2_975,
  gross_vnd: 122_023,
  tax_withheld_vnd: 148,
  net_vnd: 121_875,
  status: "DUE",
  report_deadline: "2020-01-06T17:00:00Z",
  payee,
  reference_code: "FL8TKK1UAQ",
  vietqr_payload: null,
  ...over,
});

const stub = row({
  repayment_day_id: "d-0",
  kind: "STUB",
  principal_vnd: 0,
  interest_vnd: 20_000,
  gross_vnd: 20_000,
  tax_withheld_vnd: 1_000,
  net_vnd: 19_000,
});

const owing = (days: RepaymentRow[]): InvestmentDue => ({
  date: "2020-01-03",
  tranche_id: "tr-1",
  reference_code: "FL8TKK1UAQ",
  investor_display: "P. H***",
  days,
  gross_vnd: days.reduce((sum, day) => sum + day.gross_vnd, 0),
  tax_withheld_vnd: days.reduce((sum, day) => sum + day.tax_withheld_vnd, 0),
  net_vnd: days.reduce((sum, day) => sum + day.net_vnd, 0),
  payee,
  vietqr_payload: "000201010212...6304ABCD",
  rejection: null,
});

const open = () => render(<RepaymentClient trancheId="tr-1" />);

beforeEach(() => {
  payMock.mockReset();
  rounds = [round([ticket()])];
  projection = undefined;
  // Paid on the first two days; the third due and unpaid; the last next year.
  schedule = [
    { ...stub, status: "MATCHED" },
    row({ repayment_day_id: "d-1", status: "MATCHED" }),
    row({
      repayment_day_id: "d-2",
      due_date: "2020-01-03",
      status: "PRESUMED_PAID",
    }),
    row({ repayment_day_id: "d-3", due_date: "2020-01-06" }),
    row({ repayment_day_id: "d-4", due_date: "2099-01-07" }),
  ];
  due = owing([schedule[3]]);
});

describe("RepaymentClient", () => {
  it("shows how many days are paid and left, and the tickets as cards", () => {
    open();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "P. H***",
    );
    const progress = screen.getByTestId("investment-progress");
    expect(progress).toHaveTextContent(
      'dashboard.sme.investment.daysPaid:{"paid":2,"count":4}',
    );
    expect(progress).toHaveTextContent(
      'dashboard.sme.investment.daysLeft:{"count":2}',
    );
    // Transferred so far, of the whole investment.
    expect(progress).toHaveTextContent('"paid":"₫262,750","total":"₫506,500"');

    // Opens on the tickets still to pay.
    const cards = () =>
      within(screen.getByTestId("investment-days")).getAllByRole("listitem");
    expect(cards()).toHaveLength(2);
    expect(cards()[0]).toHaveTextContent(
      'dashboard.sme.investment.dayIndex:{"index":3}',
    );
    expect(cards()[0]).toHaveTextContent("dashboard.sme.plan.status.due");
    expect(cards()[1]).toHaveTextContent("dashboard.sme.plan.status.upcoming");

    fireEvent.click(
      screen.getByRole("button", {
        name: /dashboard\.sme\.investment\.filters\.paid/,
      }),
    );
    expect(cards()).toHaveLength(2);
    // Day one carries the first-period interest: one card, one transfer.
    expect(cards()[0]).toHaveTextContent("₫142,023");
    expect(cards()[0]).toHaveTextContent('"net":"₫140,875"');
    expect(cards()[0]).toHaveTextContent("dashboard.sme.plan.status.paid");

    fireEvent.click(
      screen.getByRole("button", {
        name: /dashboard\.sme\.investment\.filters\.all/,
      }),
    );
    expect(cards()).toHaveLength(4);
  });

  it("pays today's repayment: the investor's account and QR, then the receipt", () => {
    due = owing([
      schedule![3],
      { ...schedule![3], repayment_day_id: "d-5", due_date: "2020-01-07" },
    ]);
    open();

    const pay = screen.getByTestId("pay-today");
    expect(pay).toHaveTextContent("₫243,750");
    // An earlier unpaid day is included, and said so.
    expect(pay).toHaveTextContent(
      'dashboard.sme.investment.pay.overdue:{"count":1}',
    );
    expect(screen.queryByTestId("pay-panel")).toBeNull();

    fireEvent.click(
      within(pay).getByRole("button", {
        name: "dashboard.sme.investment.pay.repay",
      }),
    );
    const payeeBox = screen.getByTestId("payee");
    expect(payeeBox).toHaveTextContent("Techcombank");
    expect(payeeBox).toHaveTextContent("19036789012");
    expect(payeeBox).toHaveTextContent("HUYNH TAN PHAT");
    expect(payeeBox).toHaveTextContent("FL8TKK1UAQ");
    expect(screen.getByTestId("pay-qr")).toHaveAttribute(
      "data-qr-value",
      "000201010212...6304ABCD",
    );

    const send = screen.getByRole("button", {
      name: /dashboard\.sme\.investment\.pay\.send/,
    });
    expect(send).toBeDisabled(); // nothing to send without the receipt
    const receipt = new File(["png"], "receipt.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("pay-receipt-input"), {
      target: { files: [receipt] },
    });
    expect(screen.getByTestId("pay-receipt")).toHaveTextContent("receipt.png");
    fireEvent.click(send);

    const [{ repaymentDayIds, file, idempotencyKey }] = payMock.mock.calls[0];
    expect(repaymentDayIds).toEqual(["d-3", "d-5"]);
    expect(file).toBe(receipt);
    expect(idempotencyKey).toEqual(expect.any(String));
  });

  it("says why a day is due again when FundLok denied its receipt", () => {
    due = {
      ...owing([schedule![3]]),
      rejection: {
        reason: "Wrong amount",
        decided_at: "2020-01-07T03:00:00Z",
      },
    };
    open();

    expect(screen.getByTestId("pay-rejected")).toHaveTextContent(
      'dashboard.sme.investment.pay.rejected:{"reason":"Wrong amount"}',
    );
  });

  it("refuses a file that is not a receipt before sending it", () => {
    open();
    fireEvent.click(
      screen.getByRole("button", {
        name: "dashboard.sme.investment.pay.repay",
      }),
    );
    fireEvent.change(screen.getByTestId("pay-receipt-input"), {
      target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "dashboard.sme.investment.pay.errors.UNSUPPORTED_TYPE",
    );
    expect(
      screen.getByRole("button", {
        name: /dashboard\.sme\.investment\.pay\.send/,
      }),
    ).toBeDisabled();
  });

  it("says when nothing is due to this investor today", () => {
    due = owing([]);
    open();

    expect(screen.getByTestId("pay-today")).toHaveTextContent(
      "dashboard.sme.investment.pay.none",
    );
    expect(
      screen.queryByRole("button", {
        name: "dashboard.sme.investment.pay.repay",
      }),
    ).toBeNull();
  });

  it("shows a received investment's projected tickets, with nothing to pay yet", () => {
    rounds = [round([ticket({ status: "CONFIRMED" })])];
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
    open();

    const progress = screen.getByTestId("investment-progress");
    expect(progress).toHaveTextContent("dashboard.sme.plan.badge");
    expect(progress).not.toHaveTextContent("dashboard.sme.investment.daysPaid");
    expect(progress).toHaveTextContent('"gross":"₫254,002","net":"₫251,301"');
    expect(screen.queryByTestId("pay-today")).toBeNull();
    const cards = within(screen.getByTestId("investment-days")).getAllByRole(
      "listitem",
    );
    expect(cards).toHaveLength(2);
    expect(cards[0]).not.toHaveTextContent("dashboard.sme.plan.status");
  });

  it("does not find an investment outside the business's rounds", () => {
    rounds = [round([ticket({ id: "someone-else" })])];
    open();

    expect(screen.getByTestId("investment-not-found")).toBeInTheDocument();
    expect(screen.queryByTestId("pay-today")).toBeNull();
  });
});
