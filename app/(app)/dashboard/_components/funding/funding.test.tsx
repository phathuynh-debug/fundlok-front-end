import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { FundingStatus } from "../loan-application/FundingStatus";
import { TodaysRepayments } from "./TodaysRepayments";
import { investmentProgress, ticketsByDay } from "./investment-days";
import type { SmeRepaymentPlan, SmeRound } from "@/services/funding.service";
import type {
  RepaymentRow,
  TodaysPayments,
} from "@/services/repayment.service";

const closeMock = vi.fn();
const reportMissingMock = vi.fn();
let rounds: SmeRound[] = [];
let today: TodaysPayments | undefined;
let plan: SmeRepaymentPlan | undefined;

vi.mock("@/hooks/use-funding", () => ({
  useMyRounds: () => ({ data: rounds, isLoading: false }),
  useCloseRoundEarly: () => ({ mutate: closeMock, isPending: false }),
  useReportMissingTransfer: () => ({
    mutate: reportMissingMock,
    isPending: false,
  }),
  useRepaymentPlan: () => ({ data: plan, isLoading: false }),
}));
vi.mock("@/hooks/use-repayment", () => ({
  useTodaysPayments: () => ({ data: today, isLoading: false }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

const t = (key: string) => key;

const round = (over: Partial<SmeRound> = {}): SmeRound => ({
  id: "w-1",
  listing_id: "l-1",
  status: "OPEN",
  target_vnd: 50_000_000,
  min_raise_vnd: 25_000_000,
  min_ticket_vnd: 10_000_000,
  confirmed_vnd: 0,
  reserved_vnd: 10_000_000,
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
  tickets: [
    {
      id: "tr-1",
      amount_vnd: 10_000_000,
      status: "CONFIRMED",
      reference_code: "FL8TKK1UAQ",
      investor_display: "P. H***",
      attested_at: "2026-11-02T06:00:00Z",
      confirm_deadline: "2026-11-04T17:00:00Z",
      review_cause: null,
    },
    {
      id: "tr-2",
      amount_vnd: 25_000_000,
      status: "EXPIRED",
      reference_code: "FLZT7CTIKE",
      investor_display: "P. H***",
      attested_at: null,
      confirm_deadline: null,
      review_cause: null,
    },
  ],
  ...over,
});

beforeEach(() => {
  closeMock.mockReset();
  reportMissingMock.mockReset();
  rounds = [];
  today = undefined;
  plan = undefined;
});

describe("FundingStatus", () => {
  it("claims no progress before the business's round opens", () => {
    render(<FundingStatus projectId="p-1" t={t} />);
    expect(screen.getByText("dashboard.sme.funding.none")).toBeInTheDocument();
  });

  it("shows each investor, masked, with nothing for the business to confirm", () => {
    rounds = [round()];
    render(<FundingStatus projectId="p-1" t={t} />);

    const tickets = screen.getByTestId("round-tickets");
    expect(tickets).toHaveTextContent("P. H***");
    expect(tickets).toHaveTextContent("FL8TKK1UAQ");
    expect(tickets).toHaveTextContent(
      "dashboard.sme.funding.ticketStatus.CONFIRMED",
    );
    expect(tickets).not.toHaveTextContent("FLZT7CTIKE"); // a lapsed hold is no investment
    // Staff approval means received: no confirm or dispute buttons. The
    // received investment opens its own page of repayment tickets.
    expect(within(tickets).queryAllByRole("button")).toHaveLength(0);
    expect(within(tickets).getByRole("link")).toHaveAttribute(
      "href",
      "/dashboard/repayments/tr-1",
    );
  });

  it("lets the business report a transfer as not received once the investor uploads a receipt", () => {
    rounds = [
      round({
        tickets: [
          {
            id: "tr-sent",
            amount_vnd: 15_000_000,
            status: "SIGNED",
            reference_code: "FL9SENT123",
            investor_display: "N. A***",
            receipt_submitted_at: "2026-11-04T08:00:00Z",
            attested_at: null,
            confirm_deadline: null,
            review_cause: null,
          },
        ],
      }),
    ];
    render(<FundingStatus projectId="p-1" t={t} />);

    const tickets = screen.getByTestId("round-tickets");
    expect(tickets).toHaveTextContent(
      "dashboard.sme.funding.ticketStatus.RECEIPT_SUBMITTED",
    );
    fireEvent.click(
      within(tickets).getByRole("button", {
        name: "dashboard.sme.funding.report",
      }),
    );
    fireEvent.change(
      within(tickets).getByRole("textbox", {
        name: "dashboard.sme.funding.reportPlaceholder",
      }),
      { target: { value: "No money arrived under FL9SENT123" } },
    );
    fireEvent.click(
      within(tickets).getByRole("button", {
        name: "dashboard.sme.funding.reportSend",
      }),
    );
    expect(reportMissingMock).toHaveBeenCalledWith(
      {
        trancheId: "tr-sent",
        statement: "No money arrived under FL9SENT123",
      },
      expect.anything(),
    );
  });

  it("lets the business close early only once the minimum is confirmed", () => {
    rounds = [round()];
    const { unmount } = render(<FundingStatus projectId="p-1" t={t} />);
    expect(
      screen.getByRole("button", {
        name: /dashboard\.sme\.funding\.closeEarly/,
      }),
    ).toBeDisabled();
    unmount();

    rounds = [round({ confirmed_vnd: 25_000_000 })];
    render(<FundingStatus projectId="p-1" t={t} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /dashboard\.sme\.funding\.closeEarly/,
      }),
    );
    // Final, so it asks first.
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: /dashboard\.sme\.funding\.closeEarly/,
      }),
    );
    expect(closeMock).toHaveBeenCalledWith("w-1", expect.anything());
  });

  it("tells the business when what is left is below the minimum ticket", () => {
    // 45M asked, 40M confirmed: only one investor taking exactly 5M fills it.
    rounds = [
      round({
        target_vnd: 45_000_000,
        confirmed_vnd: 40_000_000,
        reserved_vnd: 0,
        capacity_vnd: 5_000_000,
      }),
    ];
    const { unmount } = render(<FundingStatus projectId="p-1" t={t} />);
    const note = screen.getByTestId("last-ticket-note");
    expect(note).toHaveTextContent("dashboard.sme.funding.lastTicketNote");
    expect(note).toHaveTextContent('"amount":"₫5,000,000"');
    expect(note).toHaveTextContent('"min":"₫10,000,000"');
    // The minimum raise is confirmed, so it can also close now.
    expect(note).toHaveTextContent(
      "dashboard.sme.funding.lastTicketCloseEarly",
    );
    unmount();

    // Not yet at the minimum raise: no close-now hint.
    rounds = [
      round({
        confirmed_vnd: 20_000_000,
        reserved_vnd: 25_000_000,
        capacity_vnd: 5_000_000,
      }),
    ];
    const second = render(<FundingStatus projectId="p-1" t={t} />);
    expect(screen.getByTestId("last-ticket-note")).not.toHaveTextContent(
      "lastTicketCloseEarly",
    );
    second.unmount();

    // A full minimum ticket still fits, or nothing is left: no note.
    for (const capacity of [10_000_000, 0]) {
      rounds = [round({ capacity_vnd: capacity })];
      const view = render(<FundingStatus projectId="p-1" t={t} />);
      expect(screen.queryByTestId("last-ticket-note")).toBeNull();
      view.unmount();
    }
  });

  it("shows today's repayments once the loan has formed", () => {
    rounds = [
      round({ status: "REPAYING", repayment_start_date: "2026-11-03" }),
    ];
    today = {
      date: "2026-11-03",
      rows: [],
      totals: { gross_vnd: 0, tax_withheld_vnd: 0, net_vnd: 0 },
    };
    render(<FundingStatus projectId="p-1" t={t} />);

    expect(screen.getByTestId("todays-repayments")).toHaveTextContent(
      "dashboard.sme.repayments.none",
    );
  });
});

describe("TodaysRepayments", () => {
  const row = {
    repayment_day_id: "d-1",
    tranche_id: "tr-1",
    kind: "INSTALMENT" as const,
    investor_display: "P. H***",
    due_date: "2026-11-03",
    principal_vnd: 119_048,
    interest_vnd: 6_349,
    gross_vnd: 125_397,
    tax_withheld_vnd: 317,
    net_vnd: 125_080,
    status: "DUE" as const,
    report_deadline: "2026-11-05T17:00:00Z",
    payee: {
      bank_name: "Techcombank",
      bank_bin: "970407",
      account_number: "19036789012",
      account_name: "PHAT HUYNH",
    },
    reference_code: "FL8TKK1UAQ",
    vietqr_payload: "000201010212...6304ABCD",
  };

  it("lists each investor once, with what to transfer, and sends the business to pay from the investment's page", () => {
    today = {
      date: "2026-11-03",
      rows: [
        row,
        {
          ...row,
          repayment_day_id: "d-0",
          kind: "STUB",
          principal_vnd: 0,
          interest_vnd: 20_000,
          gross_vnd: 20_000,
          tax_withheld_vnd: 1_000,
          net_vnd: 19_000,
        },
        {
          ...row,
          repayment_day_id: "d-9",
          tranche_id: "tr-2",
          investor_display: "N. A***",
          reference_code: "FLZT7CTIKE",
          status: "PRESUMED_PAID",
        },
      ],
      totals: { gross_vnd: 270_794, tax_withheld_vnd: 1_634, net_vnd: 269_160 },
    };
    render(<TodaysRepayments />);

    const [owing, marked] = screen.getAllByTestId("repayment-ticket");
    // The day's instalment and its first-period interest are one transfer.
    expect(owing).toHaveTextContent("₫144,080");
    expect(owing).toHaveTextContent(
      'dashboard.sme.repayments.inclTax:{"gross":"₫145,397"}',
    );
    expect(
      within(owing).getByRole("link", { name: "dashboard.sme.repayments.pay" }),
    ).toHaveAttribute("href", "/dashboard/repayments/tr-1");
    // Marked paid already: nothing to pay, nothing to tick here.
    expect(marked).toHaveTextContent(
      "dashboard.sme.repayments.status.PRESUMED_PAID",
    );
    expect(within(marked).queryByRole("link")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    // What is still to transfer, not what was already marked.
    expect(screen.getByTestId("todays-repayments")).toHaveTextContent(
      'dashboard.sme.repayments.total:{"net":"₫144,080"}',
    );
  });
});

describe("RepaymentPlan", () => {
  const day = (due_date: string, gross: number, over = {}) => ({
    due_date,
    principal_vnd: gross - 3_000,
    interest_vnd: 3_000,
    gross_vnd: gross,
    tax_withheld_vnd: 0,
    net_vnd: gross,
    tickets: 1,
    paid: 0,
    missing: 0,
    ...over,
  });

  it("shows the business its projected daily tickets before the loan forms", () => {
    rounds = [round({ confirmed_vnd: 10_000_000 })];
    plan = {
      kind: "PROJECTED",
      assumed_close_date: "2026-11-13",
      start_date: "2026-11-16",
      days: [
        day("2026-11-16", 180_000, { tickets: 2 }),
        day("2026-11-17", 122_023),
        day("2026-11-18", 122_024),
      ],
      totals: { gross_vnd: 424_047, tax_withheld_vnd: 0, net_vnd: 424_047 },
    };
    render(<FundingStatus projectId="p-1" t={t} />);

    const card = screen.getByTestId("repayment-plan");
    expect(card).toHaveTextContent("dashboard.sme.plan.headingProjected");
    expect(card).toHaveTextContent("dashboard.sme.plan.badge");
    // The first day carries the first-period interest: the range is the days after it.
    expect(card).toHaveTextContent('"low":"₫122,023","high":"₫122,024"');
    fireEvent.click(
      screen.getByRole("button", { name: "dashboard.sme.plan.show" }),
    );
    expect(
      within(screen.getByTestId("repayment-plan-days")).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(3);
    // Each day says what it is made of: money coming back and interest.
    expect(
      within(screen.getByTestId("repayment-plan-days")).getAllByTestId(
        "repayment-breakdown",
      )[1],
    ).toHaveTextContent('"principal":"₫119,023","interest":"₫3,000"');
  });

  it("shows each repayment tax included, and what the business transfers after keeping the tax back", () => {
    rounds = [round({ confirmed_vnd: 10_000_000 })];
    plan = {
      kind: "ACTUAL",
      assumed_close_date: null,
      start_date: "2026-11-03",
      days: [
        day("2026-11-03", 122_023, { tax_withheld_vnd: 148, net_vnd: 121_875 }),
        day("2026-11-04", 122_023, { tax_withheld_vnd: 148, net_vnd: 121_875 }),
      ],
      totals: { gross_vnd: 244_046, tax_withheld_vnd: 296, net_vnd: 243_750 },
    };
    render(<FundingStatus projectId="p-1" t={t} />);

    const card = screen.getByTestId("repayment-plan");
    expect(card).toHaveTextContent("₫244,046"); // to repay, tax included
    expect(card).toHaveTextContent("₫243,750"); // transferred to investors
    expect(card).toHaveTextContent("dashboard.sme.plan.taxKept");
    expect(card).toHaveTextContent("₫296"); // kept back for the tax office
    // Each working day both ways: repaid tax included, and transferred.
    expect(card).toHaveTextContent("dashboard.sme.plan.perDay₫122,023");
    expect(card).toHaveTextContent("dashboard.sme.plan.perDayNet₫121,875");
  });

  it("shows which real days are paid once the loan has formed", () => {
    rounds = [
      round({
        status: "REPAYING",
        confirmed_vnd: 10_000_000,
        repayment_start_date: "2020-01-02",
      }),
    ];
    today = {
      date: "2020-01-03",
      rows: [],
      totals: { gross_vnd: 0, tax_withheld_vnd: 0, net_vnd: 0 },
    };
    plan = {
      kind: "ACTUAL",
      assumed_close_date: null,
      start_date: "2020-01-02",
      days: [
        day("2020-01-02", 180_000, { tickets: 2, paid: 2 }),
        day("2020-01-03", 122_024, { missing: 1 }),
        day("2099-01-04", 122_024),
      ],
      totals: { gross_vnd: 424_048, tax_withheld_vnd: 0, net_vnd: 424_048 },
    };
    render(<FundingStatus projectId="p-1" t={t} />);

    const card = screen.getByTestId("repayment-plan");
    expect(card).toHaveTextContent("dashboard.sme.plan.heading");
    expect(card).toHaveTextContent('"paid":1,"count":3');
    fireEvent.click(
      screen.getByRole("button", { name: "dashboard.sme.plan.show" }),
    );
    const days = within(screen.getByTestId("repayment-plan-days")).getAllByRole(
      "listitem",
    );
    expect(days[0]).toHaveTextContent("dashboard.sme.plan.status.paid");
    expect(days[1]).toHaveTextContent("dashboard.sme.plan.status.missing");
    expect(days[2]).toHaveTextContent("dashboard.sme.plan.status.upcoming");
  });
});

describe("investment days", () => {
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
    payee: null,
    reference_code: "FL8TKK1UAQ",
    vietqr_payload: null,
    ...over,
  });
  it("counts one ticket a day, the first-period interest in the first, and what is paid and left", () => {
    const rows = [
      row({
        repayment_day_id: "s",
        kind: "STUB",
        principal_vnd: 0,
        interest_vnd: 20_000,
        gross_vnd: 20_000,
        tax_withheld_vnd: 1_000,
        net_vnd: 19_000,
        status: "PRESUMED_PAID",
      }),
      row({ repayment_day_id: "d-1", status: "PRESUMED_PAID" }),
      row({
        repayment_day_id: "d-2",
        due_date: "2020-01-03",
        status: "REPORTED_MISSED",
      }),
      row({ repayment_day_id: "d-3", due_date: "2020-01-06" }),
      row({ repayment_day_id: "d-4", due_date: "2099-01-07" }),
    ];
    const days = ticketsByDay(rows, "2026-11-02");

    expect(days.map((day) => day.index)).toEqual([1, 2, 3, 4]);
    expect(days.map((day) => day.status)).toEqual([
      "paid",
      "missing",
      "due",
      "upcoming",
    ]);
    expect(days[0].gross_vnd).toBe(142_023); // the instalment and the first-period interest
    expect(days[0].net_vnd).toBe(140_875);
    const progress = investmentProgress(days, "2026-11-02");
    expect(progress).toMatchObject({
      count: 4,
      paidDays: 1,
      leftDays: 3, // a day reported missing is not paid
      paidNet: 140_875,
      totalNet: 140_875 + 3 * 121_875,
      leftGross: 3 * 122_023,
      leftNet: 3 * 121_875,
      overdue: 1, // 06/01/2020 passed unmarked; the reported day is with FundLok
    });
    expect(progress.next?.due_date).toBe("2020-01-06");
  });
});
