import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import InvestClient from "./client";
import type { FundingWindow } from "@/services/funding.service";

// The invest flow when less than a minimum ticket is left on the round: the
// amount from the project page must be exactly what is left (the last-ticket
// rule, funding-window.md I-6).

const replaceMock = vi.fn();
let search = "";
let fundingWindow: FundingWindow;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("next/link", () => ({
  default: ({ children }: React.PropsWithChildren) => <a>{children}</a>,
}));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/use-authentication", () => ({
  useRequireAuth: () => ({ isLoading: false }),
}));
vi.mock("@/hooks/use-payment-accounts", () => ({
  useHasBankAccount: () => ({
    hasAccount: true,
    hasPending: false,
    isLoaded: true,
  }),
}));
vi.mock("@/hooks/use-projects", () => ({
  usePublicProjects: () => ({
    data: [
      {
        id: "p-1",
        legal_name: "ABC Co",
        loan_application: { listing: { id: "lst-1" } },
      },
    ],
    isLoading: false,
  }),
}));
vi.mock("@/hooks/use-funding", () => ({
  useFundingWindow: () => ({
    data: fundingWindow,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useMyTranches: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useInvestorAgreement: () => ({
    data: { required: false, signed_at: null, version: "v1" },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useInvestmentConfirmation: () => ({
    data: undefined,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useReserveTicket: () => ({
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    data: undefined,
  }),
}));
// Steps that fetch on their own: not under test here.
vi.mock("./_components/SignedLoanContractCard", () => ({
  SignedLoanContractCard: () => null,
}));
vi.mock("./_components/InvestmentConfirmationTable", () => ({
  InvestmentConfirmationTable: () => null,
}));
vi.mock("../_components/BankAccountPrompt", () => ({
  BankAccountPrompt: () => null,
}));

// 45M asked, 40M taken: 5M left, below the 10M minimum.
const window_ = (over: Partial<FundingWindow> = {}): FundingWindow => ({
  id: "w-1",
  listing_id: "lst-1",
  status: "OPEN",
  target_vnd: 45_000_000,
  min_raise_vnd: 22_500_000,
  min_ticket_vnd: 10_000_000,
  confirmed_vnd: 40_000_000,
  reserved_vnd: 0,
  capacity_vnd: 5_000_000,
  annual_rate_pct: "16.000",
  term_months: 4,
  window_start: "2026-11-01T00:00:00Z",
  window_end: "2026-11-15T00:00:00Z",
  days_left: 2,
  tranche_count: 4,
  ...over,
});

describe("InvestClient — last ticket below the minimum", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    fundingWindow = window_();
  });

  it("explains an amount other than what is left, and offers exactly that", () => {
    search = "projectId=p-1&amount=10000000";
    render(<InvestClient />);

    expect(
      screen.getByText(
        'investment.lastTicket.outOfRangeTitle:{"amount":"₫5,000,000"}',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'investment.lastTicket.outOfRangeBody:{"amount":"₫5,000,000","min":"₫10,000,000"}',
      ),
    ).toBeInTheDocument();
    // Not the generic "between 5M and 5M" range.
    expect(screen.queryByText(/amountOutOfRangeTitle/)).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /investment\.lastTicket\.investExactly/ }),
    );
    expect(replaceMock).toHaveBeenCalledWith(
      "/dashboard/invest?projectId=p-1&amount=5000000",
    );
  });

  it("says the investor's ticket completes the round when it takes exactly what is left", () => {
    search = "projectId=p-1&amount=5000000";
    render(<InvestClient />);

    expect(screen.getByTestId("last-ticket-notice")).toHaveTextContent(
      'investment.lastTicket.completesTitle:{"amount":"₫5,000,000","min":"₫10,000,000"}',
    );
  });

  it("shows no last-ticket notice while a full minimum ticket still fits", () => {
    fundingWindow = window_({ capacity_vnd: 15_000_000 });
    search = "projectId=p-1&amount=10000000";
    render(<InvestClient />);

    expect(screen.queryByTestId("last-ticket-notice")).toBeNull();
    expect(screen.queryByText(/investment\.lastTicket/)).toBeNull();
  });
});
