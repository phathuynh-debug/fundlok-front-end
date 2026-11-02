import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InvestmentCard, repaymentSummary } from "./InvestmentCard";
import type { Tranche } from "@/services/funding.service";
import type {
  ProjectedSchedule,
  RepaymentRow,
} from "@/services/repayment.service";

const reportMock = vi.fn();
let schedule: RepaymentRow[] | undefined;
let projection: ProjectedSchedule | undefined;

vi.mock("@/hooks/use-repayment", () => ({
  useRepaymentSchedule: () => ({ data: schedule, isLoading: false }),
  useRepaymentProjection: () => ({ data: projection, isLoading: false }),
  useReportMissingDay: () => ({ mutate: reportMock, isPending: false }),
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
  schedule = undefined;
  projection = undefined;
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
    // The first payment carries the first-period interest too.
    expect(block).toHaveTextContent('"amount":"₫149,400"');
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
