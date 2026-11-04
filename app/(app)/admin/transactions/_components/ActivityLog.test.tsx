import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityLog } from "./ActivityLog";
import { activityKind } from "./activity";
import type { AdminFundingActivity } from "@/services/admin-funding.service";

const entry = (
  overrides: Partial<AdminFundingActivity>,
): AdminFundingActivity => ({
  id: "a-1",
  action: "TRANSFER_RECEIPT_CHECKED",
  created_at: "2026-11-02T07:00:00Z",
  ip_address: null,
  actor: { id: "admin-1", full_name: "Le Minh", email: "minh@fundlok.com" },
  tranche_id: "tr-1",
  reference_code: "FL8TKK1UAQ",
  amount_vnd: 10_000_000,
  project_name: "Delta Foods",
  investor: { id: "inv-1", full_name: "Nguyen Van An", email: "an@x.com" },
  check_status: "MATCHED",
  failure_codes: [],
  tranche_status: "ATTESTED",
  reason: "Read from the receipt",
  ...overrides,
});

let rows: AdminFundingActivity[] = [];
vi.mock("@/hooks/use-admin-funding", () => ({
  useAdminFundingActivity: () => ({
    data: { items: rows, total: rows.length, page: 1, page_size: 20 },
    isLoading: false,
    isFetching: false,
  }),
}));
vi.mock("./TransferReviewSheet", () => ({ TransferReviewSheet: () => null }));
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({ locale: "en", t: (key: string) => key }),
}));

describe("activityKind", () => {
  it("reads a receipt check as an approval only when it matched", () => {
    expect(activityKind(entry({}))).toEqual({
      key: "approvedMatch",
      tone: "approve",
    });
    expect(activityKind(entry({ check_status: "MISMATCH" }))).toEqual({
      key: "sentToReview",
      tone: "review",
    });
    expect(activityKind(entry({ action: "TRANSFER_NOT_RECEIVED" })).tone).toBe(
      "deny",
    );
    expect(
      activityKind(entry({ action: "TRANSFER_RECEIPT_REJECTED" })).tone,
    ).toBe("deny");
    expect(
      activityKind(entry({ action: "REPAYMENT_RECEIPT_CONFIRMED" })),
    ).toEqual({
      key: "repaymentConfirmed",
      tone: "approve",
    });
  });
});

describe("ActivityLog", () => {
  it("lists who approved or denied which investment, and why", () => {
    rows = [
      entry({
        id: "a-2",
        action: "TRANSFER_NOT_RECEIVED",
        check_status: null,
        reason: "Nothing on the statement",
      }),
      entry({ id: "a-1" }),
    ];
    render(<ActivityLog group="DECISIONS" />);

    expect(
      screen.getByText("admin.transactions.activity.kinds.notReceived"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("admin.transactions.activity.kinds.approvedMatch"),
    ).toBeInTheDocument();
    expect(screen.getByText("Nothing on the statement")).toBeInTheDocument();
    expect(screen.getAllByText("Le Minh")).toHaveLength(2);
    expect(screen.getAllByText("FL8TKK1UAQ")).toHaveLength(2);
  });
});
