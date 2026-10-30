import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatDate } from "@/lib/format-date";
import {
  INVESTOR_TERMS_VERSION,
  type FundingWindow,
} from "@/services/funding.service";
import { InvestTerms } from "./InvestTerms";
import { t } from "./test-t";

const fundingWindow: FundingWindow = {
  id: "w-1",
  listing_id: "l-1",
  status: "OPEN",
  target_vnd: 80_000_000,
  min_raise_vnd: 40_000_000,
  min_ticket_vnd: 10_000_000,
  confirmed_vnd: 0,
  reserved_vnd: 0,
  capacity_vnd: 80_000_000,
  annual_rate_pct: "16.000",
  term_months: 4,
  window_start: "2026-10-30T03:00:00Z",
  window_end: "2026-11-13T03:00:00Z",
  days_left: 14,
  tranche_count: 0,
};

const renderTerms = (onAgree = vi.fn(), isPending = false) =>
  render(
    <InvestTerms
      amount={20_000_000}
      businessName="Delta Foods JSC"
      fundingWindow={fundingWindow}
      isPending={isPending}
      onAgree={onAgree}
      locale="en"
      t={t}
    />,
  );

describe("InvestTerms", () => {
  it("lists every rule, filled in from this window", () => {
    renderTerms();
    const terms = screen.getByTestId("investing-terms");
    expect(within(terms).getAllByRole("listitem")).toHaveLength(9);
    expect(terms).toHaveTextContent("You lend directly to Delta Foods JSC");
    expect(terms).toHaveTextContent("for a term of 4 months");
    expect(terms).toHaveTextContent(
      `The round closes on ${formatDate(fundingWindow.window_end, "en")}`,
    );
    expect(terms).toHaveTextContent("you bear the loss");
    expect(
      screen.getByText(`Terms version ${INVESTOR_TERMS_VERSION}`),
    ).toBeInTheDocument();
  });

  it("reserves only once the terms are agreed to", async () => {
    const onAgree = vi.fn();
    renderTerms(onAgree);
    const submit = screen.getByRole("button", { name: /Agree and reserve/ });
    expect(submit).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    expect(onAgree).toHaveBeenCalledTimes(1);
  });

  it("holds the button while the reservation is on its way", () => {
    renderTerms(vi.fn(), true);
    expect(screen.getByRole("button", { name: /Reserving/ })).toBeDisabled();
  });
});
