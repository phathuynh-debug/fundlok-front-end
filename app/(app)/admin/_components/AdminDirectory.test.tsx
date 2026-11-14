import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import type { AdminUserRow } from "@/services/admin.service";
import { AdminDirectory } from "./AdminDirectory";

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string) => key,
  }),
}));

vi.mock("./UserPreviewSheet", () => ({ UserPreviewSheet: () => null }));
vi.mock("./ProjectPreviewSheet", () => ({ ProjectPreviewSheet: () => null }));

const base = {
  status: "ACTIVE",
  email_verified: true,
  created_at: "2026-11-01T03:00:00Z",
  consent_status: "ACCEPTED" as const,
};

const users: AdminUserRow[] = [
  {
    ...base,
    id: "1",
    email: "linh@example.vn",
    full_name: "Nguyen Thuy Linh",
    role: "SME",
    phone: "+84912345678",
    phone_verified_at: "2026-11-12T03:00:00Z",
  },
  {
    ...base,
    id: "2",
    email: "an@example.com",
    full_name: "Tran Van An",
    role: "INVESTOR",
    phone: "+84987654321",
    phone_verified_at: null,
  },
  {
    ...base,
    id: "3",
    email: "mai@example.vn",
    full_name: "Le Thi Mai",
    role: "SME",
    phone: null,
    phone_verified_at: null,
  },
  {
    ...base,
    id: "4",
    email: "ops@fundlok.com",
    full_name: "Ops Admin",
    role: "ADMIN",
    phone: null,
    phone_verified_at: null,
    consent_status: "NOT_APPLICABLE",
  },
];

vi.mock("@/hooks/use-admin", () => ({
  useAdminOverview: () => ({
    data: {
      mode: "users",
      stats: {
        total_users: 4,
        total_projects: 0,
        users_by_role: { SME: 2, INVESTOR: 1, ADMIN: 1 },
        users_by_status: { ACTIVE: 4 },
        projects_by_status: {},
      },
      table: { items: users, total: 4, page: 1, page_size: 14, total_pages: 1 },
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

function rowOf(name: string): HTMLElement {
  return screen.getByText(name).closest("tr") as HTMLElement;
}

describe("AdminDirectory users table: phone column", () => {
  it("shows each user's phone and whether it is verified", () => {
    render(<AdminDirectory mode="users" />);

    expect(screen.getByText("admin.table.phone")).toBeTruthy();

    const linh = within(rowOf("Nguyen Thuy Linh"));
    expect(linh.getByText("+84 912 345 678")).toBeTruthy();
    expect(linh.getByText("admin.phone.verified")).toBeTruthy();

    const an = within(rowOf("Tran Van An"));
    expect(an.getByText("+84 987 654 321")).toBeTruthy();
    expect(an.getByText("admin.phone.unverified")).toBeTruthy();

    // An SME without a number still owes the phone step.
    const mai = within(rowOf("Le Thi Mai"));
    expect(mai.getByText("admin.phone.missing")).toBeTruthy();

    // Admins are exempt: a dash, not a warning.
    const ops = within(rowOf("Ops Admin"));
    expect(ops.queryByText("admin.phone.missing")).toBeNull();
  });
});
