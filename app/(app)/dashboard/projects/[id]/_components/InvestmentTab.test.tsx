import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { InvestmentTab } from "./InvestmentTab";
import type { FundingWindow } from "@/services/funding.service";
import type { MarketplaceListing } from "@/services/projects.service";

const pushMock = vi.fn();
const toastMock = vi.fn();
let fundingWindow: FundingWindow;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("next/link", () => ({
  default: ({ children }: React.PropsWithChildren) => <a>{children}</a>,
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("@/hooks/use-verification-gate", () => ({
  useVerificationGate: () => ({
    proceed: (_target: string, go: () => void) => go(),
  }),
}));
vi.mock("@/hooks/use-payment-accounts", () => ({
  useHasBankAccount: () => ({
    hasAccount: true,
    hasPending: false,
    isLoaded: true,
  }),
}));
vi.mock("@/hooks/use-funding", () => ({
  useFundingWindow: () => ({
    data: fundingWindow,
    isLoading: false,
    isError: false,
  }),
  useMyTranches: () => ({ data: [] }),
}));

const listing = { id: "lst-1" } as MarketplaceListing;

// 45M asked, 40M taken by four investors: 5M left, below the 10M minimum.
const window_ = (over: Partial<FundingWindow> = {}): FundingWindow => ({
  id: "w-1",
  listing_id: "lst-1",
  status: "OPEN",
  target_vnd: 45_000_000,
  min_raise_vnd: 22_500_000,
  min_ticket_vnd: 10_000_000,
  confirmed_vnd: 30_000_000,
  reserved_vnd: 10_000_000,
  capacity_vnd: 5_000_000,
  annual_rate_pct: "16.000",
  term_months: 4,
  window_start: "2026-11-01T00:00:00Z",
  window_end: "2026-11-15T00:00:00Z",
  days_left: 2,
  tranche_count: 4,
  ...over,
});

const amountInput = () => screen.getByLabelText("investment.tab.investmentAmount");
const invest = () =>
  fireEvent.click(screen.getByRole("button", { name: /investNow/ }));

describe("InvestmentTab — last ticket below the minimum", () => {
  beforeEach(() => {
    pushMock.mockReset();
    toastMock.mockReset();
    fundingWindow = window_();
  });

  it("tells the investor only one ticket of exactly what is left can complete the round", () => {
    render(<InvestmentTab projectId="p-1" listing={listing} />);

    const notice = screen.getByTestId("last-ticket-notice");
    expect(notice).toHaveTextContent(
      'investment.lastTicket.title:{"amount":"₫5,000,000","min":"₫10,000,000"}',
    );
    expect(notice).toHaveTextContent("investment.lastTicket.body");
    // No "Minimum 5M · Maximum 5M" range: one exact amount.
    expect(
      screen.getByText(
        'investment.lastTicket.exactly:{"amount":"₫5,000,000"}',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/investment\.tab\.minimum/)).toBeNull();
  });

  it("refuses any other amount, and goes on with exactly what is left", () => {
    render(<InvestmentTab projectId="p-1" listing={listing} />);

    fireEvent.change(amountInput(), { target: { value: "4000000" } });
    invest();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description:
          'investment.lastTicket.mustBeExact:{"amount":"₫5,000,000"}',
      }),
    );
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.change(amountInput(), { target: { value: "5000000" } });
    invest();
    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/invest?amount=5000000&projectId=p-1",
    );
  });

  it("shows the usual range while a full minimum ticket still fits", () => {
    fundingWindow = window_({ capacity_vnd: 15_000_000, reserved_vnd: 0 });
    render(<InvestmentTab projectId="p-1" listing={listing} />);

    expect(screen.queryByTestId("last-ticket-notice")).toBeNull();
    expect(
      screen.getByText(/investment\.tab\.minimum:\{"amount":"₫10,000,000"\}/),
    ).toBeInTheDocument();
  });
});
