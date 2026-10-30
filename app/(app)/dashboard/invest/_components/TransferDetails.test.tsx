import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PaymentInstructions } from "@/services/funding.service";
import { TransferDetails } from "./TransferDetails";
import { t } from "./test-t";

let payment: { isLoading: boolean; data?: PaymentInstructions };
vi.mock("@/hooks/use-funding", () => ({
  usePaymentInstructions: () => payment,
}));

const instructions = (holdMs: number): PaymentInstructions => ({
  bank_name: "Techcombank",
  bank_bin: "970407",
  account_number: "19036789012",
  account_name: "CONG TY DELTA FOODS",
  amount_vnd: 20_000_000,
  reference_code: "FLAB12CD34",
  vietqr_payload: "000201010212...6304ABCD",
  hold_expires_at: new Date(Date.now() + holdMs).toISOString(),
});

describe("TransferDetails", () => {
  beforeEach(() => {
    payment = { isLoading: false, data: instructions(2 * 3600 * 1000) };
  });

  it("shows the business's account, the amount, the memo and the QR", () => {
    render(<TransferDetails trancheId="tr-1" locale="en" t={t} />);

    const details = screen.getByTestId("transfer-details");
    expect(details).toHaveTextContent("Techcombank");
    expect(details).toHaveTextContent("19036789012");
    expect(details).toHaveTextContent("CONG TY DELTA FOODS");
    expect(details).toHaveTextContent("FLAB12CD34");
    expect(screen.getByTestId("transfer-qr")).toHaveAttribute(
      "data-qr-value",
      "000201010212...6304ABCD",
    );
    expect(screen.getByTestId("transfer-deadline")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy Payment memo" }),
    ).toBeInTheDocument();
  });

  it("says when the time to transfer has passed", () => {
    payment = { isLoading: false, data: instructions(-60 * 1000) };
    render(<TransferDetails trancheId="tr-1" locale="en" t={t} />);

    expect(
      screen.getByText("The time to transfer has passed"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("transfer-deadline")).toBeNull();
  });

  it("says so when the details cannot load", () => {
    payment = { isLoading: false, data: undefined };
    render(<TransferDetails trancheId="tr-1" locale="en" t={t} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load the transfer details",
    );
  });
});
