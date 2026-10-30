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
  useHasBankAccount: () => ({
    hasAccount: (state.data ?? []).some((a) => a.status === "APPROVED"),
    hasPending: (state.data ?? []).some((a) => a.status === "PENDING"),
    isLoaded: state.isSuccess,
  }),
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
    render(<BankAccountPrompt t={t} audience="sme" />);

    expect(
      screen.getByText("Add your bank account to make your project available"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add bank account" }),
    ).toHaveAttribute("href", "/dashboard/settings/profile#bank-account");
  });

  it("stays away once an account is approved", () => {
    state.data = [account("APPROVED")];
    render(<BankAccountPrompt t={t} audience="sme" />);
    expect(screen.queryByTestId("bank-account-prompt")).not.toBeInTheDocument();
  });

  it("says a saved account is waiting for approval", () => {
    state.data = [account("PENDING")];
    render(<BankAccountPrompt t={t} audience="sme" />);
    const prompt = screen.getByTestId("bank-account-prompt");
    expect(prompt).toHaveAttribute("data-state", "pending");
    expect(
      screen.getByText("Your bank account is waiting for approval"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View bank account" }),
    ).toHaveAttribute("href", "/dashboard/settings/profile#bank-account");
  });

  it("asks again when every saved account was rejected", () => {
    state.data = [account("REJECTED")];
    render(<BankAccountPrompt t={t} audience="sme" />);
    expect(screen.getByTestId("bank-account-prompt")).toBeInTheDocument();
  });

  it("asks an investor in the investor's words", () => {
    render(<BankAccountPrompt t={t} audience="investor" />);

    expect(
      screen.getByText("Add your bank account to invest"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add bank account" }),
    ).toHaveAttribute("href", "/dashboard/settings/profile#bank-account");
  });

  it("does not flash up before the accounts have loaded", () => {
    state.data = undefined;
    state.isSuccess = false;
    render(<BankAccountPrompt t={t} audience="sme" />);
    expect(screen.queryByTestId("bank-account-prompt")).not.toBeInTheDocument();
  });
});
