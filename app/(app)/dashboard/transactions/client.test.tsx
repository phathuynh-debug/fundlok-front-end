import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TransactionsClient from "./client";
import type { Transaction } from "@/services/portfolio.service";

let role = "INVESTOR";
let rows: Transaction[] | undefined;
let businessRows: Transaction[] | undefined;
const myTransactionsRefetch = vi.fn();

vi.mock("@/hooks/use-authentication", () => ({
  useRequireAuth: () => ({ user: { id: "u-1", role }, isLoading: false }),
}));
vi.mock("@/hooks/use-portfolio", () => ({
  useMyTransactions: (enabled: boolean) => ({
    data: enabled ? rows : undefined,
    isLoading: false,
    isFetching: false,
    refetch: myTransactionsRefetch,
  }),
  useBusinessTransactions: (enabled: boolean) => ({
    data: enabled ? businessRows : undefined,
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

const investment: Transaction = {
  id: "inv-tr-1",
  tranche_id: "tr-1",
  reference: "FL8TKK1UAQ",
  type: "INVESTMENT",
  status: "COMPLETED",
  created_at: "2026-11-02T07:18:21Z",
  amount: -10_000_000,
  currency: "VND",
  counterparty: "CÔNG TY CỔ PHẦN FUNDLOK",
  method_key: "bankTransfer",
};
const repaid: Transaction = {
  ...investment,
  id: "ret-tr-1-2026-11-03",
  type: "RETURN",
  status: "PENDING",
  created_at: "2026-11-03T05:00:00Z",
  amount: 124_703,
  method_key: "dailyRepayment",
};

beforeEach(() => {
  role = "INVESTOR";
  rows = [repaid, investment];
  businessRows = [];
});

describe("TransactionsClient", () => {
  it("lists the investor's real investments and repayments, with no sample-data notice", () => {
    render(<TransactionsClient />);

    expect(screen.getAllByText("FL8TKK1UAQ").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("CÔNG TY CỔ PHẦN FUNDLOK").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("dashboard.transactions.mockNotice")).toBeNull();
    expect(
      screen.getByText('dashboard.transactions.showing:{"shown":2,"total":2}'),
    ).toBeInTheDocument();
  });

  it("shows the empty state before any money has moved", () => {
    rows = [];
    render(<TransactionsClient />);

    expect(
      screen.getByText("dashboard.transactions.emptyTitle"),
    ).toBeInTheDocument();
  });

  it("shows the business its own ledger: investments in, repayments and fees out", () => {
    role = "SME";
    businessRows = [
      {
        ...investment,
        type: "FEE",
        id: "fee-1",
        tranche_id: null,
        reference: "FL-INV-0001",
        status: "PENDING",
        amount: -330_000,
        counterparty: "FundLok",
        method_key: "platformFee",
      },
      {
        ...repaid,
        type: "REPAYMENT",
        status: "COMPLETED",
        amount: -124_703,
        counterparty: "P. H***",
      },
      {
        ...investment,
        type: "DISBURSEMENT",
        amount: 10_000_000,
        counterparty: "P. H***",
      },
    ];
    render(<TransactionsClient />);

    expect(screen.getAllByText("P. H***").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FL-INV-0001").length).toBeGreaterThan(0);
    // Received from investors, repaid to them, and FundLok's fee, apart.
    expect(screen.getByText("₫10,000,000")).toBeInTheDocument();
    expect(screen.getByText("₫124,703")).toBeInTheDocument();
    expect(screen.getByText("₫330,000")).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.transactions.smeSummary.disbursed"),
    ).toBeInTheDocument();
  });

  it("shows the business its empty state before any investment", () => {
    role = "SME";
    render(<TransactionsClient />);

    expect(
      screen.getByText("dashboard.transactions.smeEmptyTitle"),
    ).toBeInTheDocument();
  });

  it("calls refetch when the refresh button is clicked", () => {
    myTransactionsRefetch.mockClear();
    render(<TransactionsClient />);

    const refreshButtons = screen.getAllByRole("button", {
      name: "common.refresh",
    });
    expect(refreshButtons.length).toBeGreaterThan(0);
    fireEvent.click(refreshButtons[0]);
    expect(myTransactionsRefetch).toHaveBeenCalled();
  });
});
