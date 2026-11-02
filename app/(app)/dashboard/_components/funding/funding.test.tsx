import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { FundingStatus } from "../loan-application/FundingStatus";
import { TodaysRepayments } from "./TodaysRepayments";
import type { SmeRound } from "@/services/funding.service";
import type { TodaysPayments } from "@/services/repayment.service";

const closeMock = vi.fn();
const markPaidMock = vi.fn();
let rounds: SmeRound[] = [];
let today: TodaysPayments | undefined;

vi.mock("@/hooks/use-funding", () => ({
  useMyRounds: () => ({ data: rounds, isLoading: false }),
  useCloseRoundEarly: () => ({ mutate: closeMock, isPending: false }),
}));
vi.mock("@/hooks/use-repayment", () => ({
  useTodaysPayments: () => ({ data: today, isLoading: false }),
  useMarkDaysPaid: () => ({ mutate: markPaidMock, isPending: false }),
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
  markPaidMock.mockReset();
  rounds = [];
  today = undefined;
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
    // Staff approval means received: no confirm or dispute buttons.
    expect(within(tickets).queryAllByRole("button")).toHaveLength(0);
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

  it("lists one ticket per investor with its QR, and marks the chosen ones paid", () => {
    today = {
      date: "2026-11-03",
      rows: [row],
      totals: { gross_vnd: 125_397, tax_withheld_vnd: 317, net_vnd: 125_080 },
    };
    render(<TodaysRepayments />);

    const ticket = screen.getByTestId("repayment-ticket");
    expect(ticket).toHaveTextContent("19036789012");
    expect(ticket).toHaveTextContent("FL8TKK1UAQ");
    fireEvent.click(
      screen.getByRole("button", { name: "dashboard.sme.repayments.showQr" }),
    );
    expect(
      screen.getByText("dashboard.sme.repayments.qrHint"),
    ).toBeInTheDocument();

    const mark = screen.getByRole("button", {
      name: /dashboard\.sme\.repayments\.markPaid/,
    });
    expect(mark).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(mark);
    const [{ repaymentDayIds, idempotencyKey }] = markPaidMock.mock.calls[0];
    expect(repaymentDayIds).toEqual(["d-1"]);
    expect(idempotencyKey).toEqual(expect.any(String));
  });
});
