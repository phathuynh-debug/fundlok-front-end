import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import enDictionary from "@/lib/i18n/en.json";
import type { AdminPaymentAccount } from "@/services/admin.service";
import { BankAccountReviewItem } from "./BankAccountReviewItem";

const mutate = vi.fn();
vi.mock("@/hooks/use-admin", () => ({
  useDecidePaymentAccount: () => ({ mutate, isPending: false }),
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

const pending: AdminPaymentAccount = {
  id: "acc-1",
  holder_role: "SME",
  holder_type: "ENTITY",
  bank_bin: "970407",
  bank_name: "Techcombank",
  account_number: "19036789012",
  account_name: "SME TEST",
  status: "PENDING",
  rejection_reason: null,
  created_at: "2026-10-29T08:00:00Z",
  approved_at: null,
  user_id: "user-1",
  user_email: "sme@example.com",
  user_full_name: "SME Owner",
  approved_by_email: null,
};

const renderItem = (account: AdminPaymentAccount, showOwner = true) =>
  render(
    <ul>
      <BankAccountReviewItem
        account={account}
        showOwner={showOwner}
        locale="en"
        t={t}
      />
    </ul>,
  );

describe("BankAccountReviewItem", () => {
  beforeEach(() => mutate.mockReset());

  it("shows whose account it is in the review queue", () => {
    renderItem(pending);
    expect(screen.getByText("SME Owner")).toBeInTheDocument();
    expect(screen.getByText(/sme@example\.com/)).toBeInTheDocument();
    expect(screen.getByText("19036789012")).toBeInTheDocument();
    expect(screen.getByText("Pending review")).toBeInTheDocument();
  });

  it("approves a pending account, with an optional note", async () => {
    const user = userEvent.setup();
    renderItem(pending);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(mutate).toHaveBeenCalledWith(
      { id: "acc-1", body: { decision: "APPROVED", note: null } },
      expect.anything(),
    );
  });

  it("needs a reason to reject", async () => {
    const user = userEvent.setup();
    renderItem(pending);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(
      screen.getByText("Give the reason for rejecting."),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox"), "Name does not match");
    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(mutate).toHaveBeenCalledWith(
      {
        id: "acc-1",
        body: { decision: "REJECTED", note: "Name does not match" },
      },
      expect.anything(),
    );
  });

  it("shows who decided it, and no controls once decided", () => {
    renderItem({
      ...pending,
      status: "REJECTED",
      rejection_reason: "Name does not match",
      approved_at: "2026-10-30T02:00:00Z",
      approved_by_email: "admin@fundlok.com",
    });
    expect(
      screen.getByText("Rejected by admin@fundlok.com on 10/30/2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("Reason: Name does not match")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });

  it("marks an account approved on save, before reviews", () => {
    renderItem({
      ...pending,
      status: "APPROVED",
      approved_at: "2026-10-29T08:00:00Z",
    });
    expect(
      screen.getByText("Approved on save, before reviews were required"),
    ).toBeInTheDocument();
  });
});
