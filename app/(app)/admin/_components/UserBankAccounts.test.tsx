import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import enDictionary from "@/lib/i18n/en.json";
import type { AdminPaymentAccount } from "@/services/admin.service";
import { UserBankAccounts } from "./UserBankAccounts";

vi.mock("@/hooks/use-admin", () => ({
  useDecidePaymentAccount: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const t = (key: string, vars?: Record<string, string | number>) => {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      enDictionary,
    );
  if (typeof value !== "string") return key;
  return Object.entries(vars ?? {}).reduce(
    (text, [name, v]) => text.replace(`{${name}}`, String(v)),
    value,
  );
};

const account = (
  overrides: Partial<AdminPaymentAccount>,
): AdminPaymentAccount => ({
  id: "acc-1",
  holder_role: "INVESTOR",
  holder_type: "INDIVIDUAL",
  bank_bin: "970415",
  bank_name: "VietinBank",
  account_number: "123123123123",
  account_name: "HUYNH TAN PHAT",
  status: "APPROVED",
  rejection_reason: null,
  created_at: "2026-10-29T08:00:00Z",
  approved_at: "2026-10-29T08:00:00Z",
  user_id: "user-1",
  user_email: "investor@example.com",
  user_full_name: "Huynh Tan Phat",
  approved_by_email: "admin@fundlok.com",
  ...overrides,
});

describe("UserBankAccounts", () => {
  it("shows each saved account in full for the admin", () => {
    render(
      <UserBankAccounts
        accounts={[
          account({}),
          account({
            id: "acc-2",
            bank_bin: null,
            bank_name: "Quỹ tín dụng nhân dân Phú Thọ",
            account_number: "555000111",
            holder_type: "ENTITY",
          }),
        ]}
        locale="en"
        t={t}
      />,
    );

    expect(screen.getByText("VietinBank")).toBeInTheDocument();
    expect(screen.getByText("123123123123")).toBeInTheDocument();
    expect(
      screen.getByText("Quỹ tín dụng nhân dân Phú Thọ"),
    ).toBeInTheDocument();
    expect(screen.getByText("555000111")).toBeInTheDocument();
    // A typed bank is marked as outside the list; who approved each is shown.
    expect(screen.getByText("Bank outside the list")).toBeInTheDocument();
    expect(screen.getAllByText("Approved")).toHaveLength(2);
    expect(
      screen.getAllByText("Approved by admin@fundlok.com on 10/29/2026"),
    ).toHaveLength(2);
    expect(screen.getByText(/Company/)).toBeInTheDocument();
  });

  it("marks an account that is not live", () => {
    render(
      <UserBankAccounts
        accounts={[account({ status: "REJECTED" })]}
        locale="en"
        t={t}
      />,
    );
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("renders nothing when the user has saved none", () => {
    const { container } = render(
      <UserBankAccounts accounts={[]} locale="en" t={t} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
