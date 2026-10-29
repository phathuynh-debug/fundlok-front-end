import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import enDictionary from "@/lib/i18n/en.json";
import type { PaymentAccount } from "@/services/payment-accounts.service";
import { BankAccountPrompt } from "./BankAccountPrompt";

const state: { data?: PaymentAccount[]; isSuccess: boolean } = {
  data: [],
  isSuccess: true,
};

vi.mock("@/hooks/use-payment-accounts", () => ({
  usePaymentAccounts: () => state,
}));

const t = (key: string) => {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      enDictionary,
    );
  return typeof value === "string" ? value : key;
};

const account = (status: PaymentAccount["status"]): PaymentAccount => ({
  id: `acc-${status}`,
  holder_role: "SME",
  holder_type: "ENTITY",
  bank_bin: "970407",
  bank_name: "Techcombank",
  account_number: "19036789012",
  account_name: "TEST CO",
  status,
  rejection_reason: null,
  created_at: "2026-10-29T08:00:00Z",
  approved_at: null,
});

describe("BankAccountPrompt", () => {
  beforeEach(() => {
    state.data = [];
    state.isSuccess = true;
  });

  it("asks an SME with no bank account to add one, linking to the profile", () => {
    render(<BankAccountPrompt t={t} />);

    expect(
      screen.getByText("Add your bank account to make your project available"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add bank account" }),
    ).toHaveAttribute("href", "/dashboard/settings/profile#bank-account");
  });

  it("stays away once an account is saved, even while it is pending", () => {
    state.data = [account("PENDING")];
    render(<BankAccountPrompt t={t} />);
    expect(screen.queryByTestId("bank-account-prompt")).not.toBeInTheDocument();
  });

  it("asks again when every saved account was rejected", () => {
    state.data = [account("REJECTED")];
    render(<BankAccountPrompt t={t} />);
    expect(screen.getByTestId("bank-account-prompt")).toBeInTheDocument();
  });

  it("does not flash up before the accounts have loaded", () => {
    state.data = undefined;
    state.isSuccess = false;
    render(<BankAccountPrompt t={t} />);
    expect(screen.queryByTestId("bank-account-prompt")).not.toBeInTheDocument();
  });
});
