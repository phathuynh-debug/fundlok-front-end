import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AnalyticsClient from "./client";
import type {
  BusinessAnalytics,
  InvestorAnalytics,
  MonthlyPoint,
} from "@/services/portfolio.service";

let role = "INVESTOR";
let data: InvestorAnalytics | undefined;
let loan: BusinessAnalytics | undefined;

vi.mock("@/hooks/use-authentication", () => ({
  useRequireAuth: () => ({
    user: { id: "u-1", role },
    isLoading: false,
  }),
}));
vi.mock("@/hooks/use-portfolio", () => ({
  useMyAnalytics: (enabled: boolean) => ({
    data: enabled ? data : undefined,
    isLoading: false,
  }),
  useBusinessAnalytics: (enabled: boolean) => ({
    data: enabled ? loan : undefined,
    isLoading: false,
  }),
}));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

const month = (over: Partial<MonthlyPoint>): MonthlyPoint => ({
  month: "2026-10",
  deployed_cumulative: 0,
  returns_cumulative: 0,
  returns_monthly: 0,
  principal_monthly: 0,
  yield_monthly: 0,
  ...over,
});

beforeEach(() => {
  role = "INVESTOR";
  loan = {
    facility: {
      principal: 10_000_000,
      total_obligation: 10_252_976,
      interest_rate_pct: 7.5,
      term_months: 4,
      disbursed_at: "2026-11-02",
      days_remaining: 83,
      target_daily: 122_023,
      current_period_total: 2_321_413,
      current_period_end_date: "2026-11-30",
      on_time_streak: 1,
      score: 56.96,
    },
    months: [
      {
        month: "2026-11",
        repaid: 124_999,
        repaid_cumulative: 124_999,
        revenue_share: 124_999 / 6_068_197_044,
      },
    ],
    score_factors: [
      { key: "bcq", score: 57.88, weight: 0.4 },
      { key: "rsg", score: 67.31, weight: 0.25 },
      { key: "sector", score: 42.0, weight: 0.25 },
      { key: "behavioral", score: 64.75, weight: 0.1 },
    ],
    revenue_basis_vnd: 6_068_197_044,
  };
  data = {
    monthly: [
      month({ month: "2026-10" }),
      month({
        month: "2026-11",
        deployed_cumulative: 10_000_000,
        returns_cumulative: 1_000_000,
        returns_monthly: 1_000_000,
        principal_monthly: 950_000,
        yield_monthly: 50_000,
      }),
    ],
    allocation: [{ industry: "Agriculture & Farming", deployed: 10_000_000 }],
    capital_status: [
      { statusKey: "active", amount: 0 },
      { statusKey: "repaying", amount: 9_050_000 },
      { statusKey: "completed", amount: 950_000 },
      { statusKey: "writtenDown", amount: 0 },
    ],
    active_positions: 1,
  };
});

describe("AnalyticsClient", () => {
  it("shows the investor's real portfolio, earnings apart from capital coming back", () => {
    render(<AnalyticsClient />);

    expect(screen.queryByText("dashboard.analytics.mockNotice")).toBeNull();
    expect(screen.getByText("₫10,000,000")).toBeInTheDocument(); // invested
    expect(screen.getByText("₫1,000,000")).toBeInTheDocument(); // received back
    // Earnings over capital: 50,000 of 10,000,000, not the 1,000,000 that
    // came back (mostly the investor's own capital).
    expect(screen.getByText("0.5%")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // one active position

    fireEvent.click(
      screen.getByRole("button", { name: /dashboard\.analytics\.view\.table/ }),
    );
    expect(screen.getAllByText(/950,000/).length).toBeGreaterThan(0);
  });

  it("shows the empty state before any investment is received", () => {
    data = {
      monthly: [],
      allocation: [],
      capital_status: [],
      active_positions: 0,
    };
    render(<AnalyticsClient />);

    expect(
      screen.getByText("dashboard.analytics.emptyTitle"),
    ).toBeInTheDocument();
  });
  it("shows the business its loan: owed, repaid, its revenue share and its score", () => {
    role = "SME";
    render(<AnalyticsClient />);

    const view = screen.getByTestId("sme-analytics");
    // Repaid of the total, tax included, and what is left.
    expect(view).toHaveTextContent("₫124,999");
    expect(view).toHaveTextContent("₫10,252,976");
    expect(view).toHaveTextContent(
      'dashboard.smeAnalytics.progress.remaining:{"days":83}',
    );
    expect(view).toHaveTextContent("₫10,127,977"); // still to repay
    // The investors' interest, at their rate; FundLok's fee is apart.
    expect(view).toHaveTextContent('"rate":"7.50","months":4');
    expect(view).toHaveTextContent(
      "dashboard.smeAnalytics.charts.revenueShareTitle",
    );
    expect(view).toHaveTextContent('"score":"56.96"');
    // Nowhere near the affordability line.
    expect(view).not.toHaveTextContent("dashboard.smeAnalytics.overCeiling");
  });

  it("leaves out the revenue share and the score when the business has neither", () => {
    role = "SME";
    loan = {
      ...loan!,
      facility: { ...loan!.facility!, score: null },
      score_factors: [],
      revenue_basis_vnd: null,
    };
    render(<AnalyticsClient />);

    const view = screen.getByTestId("sme-analytics");
    expect(view).not.toHaveTextContent(
      "dashboard.smeAnalytics.charts.revenueShareTitle",
    );
    expect(view).not.toHaveTextContent(
      "dashboard.smeAnalytics.charts.scoreTitle",
    );
  });

  it("shows the business its empty state before any investment repays", () => {
    role = "SME";
    loan = {
      facility: null,
      months: [],
      score_factors: [],
      revenue_basis_vnd: null,
    };
    render(<AnalyticsClient />);

    expect(
      screen.getByText("dashboard.analytics.smeEmptyTitle"),
    ).toBeInTheDocument();
  });
});
