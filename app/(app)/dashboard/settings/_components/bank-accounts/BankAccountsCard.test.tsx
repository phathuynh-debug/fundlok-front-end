import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import enDictionary from "@/lib/i18n/en.json";
import type { PaymentAccount } from "@/services/payment-accounts.service";
import { BankAccountsCard } from "./BankAccountsCard";

const accountsState: {
  data?: PaymentAccount[];
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
} = { data: [], isLoading: false, isError: false, isSuccess: true };

const qrState: {
  data?: { payload: string };
  isLoading: boolean;
  isError: boolean;
  error?: { code?: string } | null;
} = { isLoading: false, isError: false };

vi.mock("@/hooks/use-payment-accounts", () => ({
  usePaymentAccounts: () => accountsState,
  useAccountVietQr: (id: string | null) =>
    id ? qrState : { isLoading: false, isError: false },
  useBanks: () => ({ data: [], isLoading: false }),
  useParseVietQr: () => ({ mutate: vi.fn(), isPending: false }),
  useSavePaymentAccount: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/i18n", () => {
  const getNested = (obj: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);

  return {
    useTranslations: () => ({
      locale: "en",
      setLocale: vi.fn(),
      t: (key: string, vars?: Record<string, string | number>) => {
        const val = getNested(enDictionary, key);
        if (typeof val !== "string") return key;
        return Object.entries(vars ?? {}).reduce(
          (text, [name, value]) => text.replace(`{${name}}`, String(value)),
          val,
        );
      },
    }),
  };
});

const account = (overrides: Partial<PaymentAccount>): PaymentAccount => ({
  id: "acc-1",
  holder_role: "INVESTOR",
  holder_type: "INDIVIDUAL",
  bank_bin: "970407",
  bank_name: "Techcombank",
  account_number: "19036789012",
  account_name: "NGUYEN VAN A",
  status: "PENDING",
  rejection_reason: null,
  created_at: "2026-10-29T08:00:00Z",
  approved_at: null,
  ...overrides,
});

describe("BankAccountsCard", () => {
  beforeEach(() => {
    accountsState.data = [];
    accountsState.isLoading = false;
    accountsState.isError = false;
    accountsState.isSuccess = true;
    qrState.data = undefined;
    qrState.isError = false;
    qrState.error = null;
  });

  it("shows an empty state and the add button", () => {
    render(<BankAccountsCard role="INVESTOR" />);
    expect(screen.getByText("No bank account yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add bank account" }),
    ).toBeInTheDocument();
  });

  it("lists accounts with their status", () => {
    accountsState.data = [
      account({ id: "a", status: "PENDING" }),
      account({
        id: "b",
        status: "APPROVED",
        bank_name: "MBBank",
        account_number: "0123456789",
      }),
      account({
        id: "c",
        status: "REJECTED",
        rejection_reason: "Name does not match",
        account_number: "555566667777",
      }),
    ];
    render(<BankAccountsCard role="INVESTOR" />);

    expect(screen.getByText("Pending review")).toBeInTheDocument();
    // Approved is the normal state (approved on save), so it carries no badge.
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("0123456789")).toBeInTheDocument();
    expect(screen.getByText("Reason: Name does not match")).toBeInTheDocument();
    expect(screen.getAllByText("Added 10/29/2026")).toHaveLength(3);
  });

  it("offers no QR for a bank outside the list", () => {
    accountsState.data = [
      account({ bank_bin: null, bank_name: "Quỹ tín dụng nhân dân Phú Thọ" }),
    ];
    render(<BankAccountsCard role="INVESTOR" />);

    expect(
      screen.getByText("Quỹ tín dụng nhân dân Phú Thọ"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show QR" }),
    ).not.toBeInTheDocument();
  });

  it("opens the account's VietQR", async () => {
    const user = userEvent.setup();
    accountsState.data = [account({})];
    qrState.data = { payload: "00020101021138570010A000000727" };
    render(<BankAccountsCard role="INVESTOR" />);

    await user.click(screen.getByRole("button", { name: "Show QR" }));

    const qr = await screen.findByTestId("account-qr-code");
    expect(qr).toHaveAttribute(
      "data-qr-value",
      "00020101021138570010A000000727",
    );
    expect(screen.getByText("VietQR for this account")).toBeInTheDocument();
  });

  it("explains when a QR cannot be made for the number", async () => {
    const user = userEvent.setup();
    accountsState.data = [account({})];
    qrState.isError = true;
    qrState.error = { code: "QR_UNSUPPORTED" };
    render(<BankAccountsCard role="INVESTOR" />);

    await user.click(screen.getByRole("button", { name: "Show QR" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A VietQR can't be made for this account.",
    );
  });
});
