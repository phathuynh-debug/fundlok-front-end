import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { InvestmentKpis } from "./InvestmentKpis";

// The component reads `locale` from the i18n hook and formats money itself —
// that is the regression under test. The default used to be the literal string
// "$50,000", which no locale switch or currency change could touch.
const locale = vi.hoisted(() => ({ current: "en" }));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: locale.current,
    setLocale: vi.fn(),
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

// framer-motion's variants add nothing to these assertions.
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("InvestmentKpis", () => {
  beforeEach(() => {
    locale.current = "en";
  });

  it("formats the loan amount as VND, not USD", () => {
    render(<InvestmentKpis loanAmountVnd={1_250_000_000} />);
    expect(screen.getByText("₫1,250,000,000")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("groups the amount the Vietnamese way when the locale is vi", () => {
    locale.current = "vi";
    render(<InvestmentKpis loanAmountVnd={1_000_000_000} />);
    expect(screen.getByText("1.000.000.000 ₫")).toBeInTheDocument();
  });

  it("renders a real backend amount, not the mock default", () => {
    render(<InvestmentKpis loanAmountVnd={500_000_000} />);
    expect(screen.getByText("₫500,000,000")).toBeInTheDocument();
    expect(screen.queryByText("₫800,000,000")).not.toBeInTheDocument();
  });

  it("keeps the amount on one line and inside the card", () => {
    render(<InvestmentKpis loanAmountVnd={1_000_000_000} />);
    const value = screen.getByText("₫1,000,000,000");
    // whitespace-nowrap stops a money figure breaking mid-number; truncate is
    // the guard that clips at the card edge instead of overflowing it.
    expect(value.className).toContain("whitespace-nowrap");
    expect(value.className).toContain("truncate");
    // The 4-column tile leaves ~180px of content width, so the figure steps
    // down a size from md upwards. text-3xl would overflow (~261px).
    expect(value.className).toContain("md:text-xl");
    expect(value.className).not.toContain("text-3xl");
  });

  it("gives every tile the same height", () => {
    // The revenue-share tile carries a second line ("of daily revenue"), so
    // with min-h alone it grew taller than the other three. h-full on each card
    // makes them all stretch to the tallest in the row.
    const { container } = render(<InvestmentKpis />);
    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.className).toContain("h-full");
      expect(card.className).toContain("min-h-32");
    }
  });

  it("localises the payback period instead of hardcoding 'mo'", () => {
    render(<InvestmentKpis paybackMonths={9} />);
    expect(
      screen.getByText('investment.kpis.months:{"count":9}'),
    ).toBeInTheDocument();
  });
});
