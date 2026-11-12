import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type {
  ReminderSender,
  ReminderSenderAccount,
} from "@/services/admin-email.service";
import { ReminderSenderCard } from "./ReminderSenderCard";

const mockReminderSender = vi.fn();
const mockSave = vi.fn();

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) =>
      key.startsWith("admin.system.reminderSender.status.")
        ? `${key} {email}`
        : key,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/use-admin-email", () => ({
  useReminderSender: () => mockReminderSender(),
  useSaveReminderSender: () => ({ mutateAsync: mockSave, isPending: false }),
}));

const alice: ReminderSenderAccount = {
  user_id: "alice",
  full_name: "Alice Nguyen",
  gmail_address: "alice@fundlok.com",
  from_name: "Alice",
  status: "READY",
};

function loaded(data: ReminderSender) {
  mockReminderSender.mockReturnValue({
    isLoading: false,
    isError: false,
    data,
  });
}

describe("ReminderSenderCard", () => {
  beforeEach(() => {
    mockReminderSender.mockReset();
    mockSave.mockReset();
  });

  it("shows the chosen account as ready, and Save waits for a change", () => {
    loaded({
      sender: alice,
      candidates: [alice],
      updated_at: "2026-11-12T03:00:00Z",
      updated_by: "sysadmin",
    });
    render(<ReminderSenderCard />);

    expect(
      screen.getByText(
        "admin.system.reminderSender.status.READY alice@fundlok.com",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("combobox").textContent).toContain(
      "Alice Nguyen · alice@fundlok.com",
    );
    const save = screen.getByRole("button", {
      name: "admin.system.reminderSender.save",
    }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });

  it("warns when the chosen account can no longer send", () => {
    const disconnected = { ...alice, status: "NOT_CONNECTED" as const };
    loaded({
      sender: disconnected,
      candidates: [disconnected],
      updated_at: "2026-11-12T03:00:00Z",
      updated_by: "sysadmin",
    });
    render(<ReminderSenderCard />);

    expect(screen.getByRole("alert").textContent).toContain(
      "admin.system.reminderSender.status.NOT_CONNECTED alice@fundlok.com",
    );
  });

  it("says nothing is sent when no account is chosen or connected", () => {
    loaded({
      sender: null,
      candidates: [],
      updated_at: null,
      updated_by: null,
    });
    render(<ReminderSenderCard />);

    expect(
      screen.getByText("admin.system.reminderSender.noneChosen"),
    ).toBeTruthy();
    expect(
      screen.getByText("admin.system.reminderSender.noAccounts"),
    ).toBeTruthy();
    expect(
      screen.getByText("admin.system.reminderSender.neverChanged"),
    ).toBeTruthy();
  });

  it("reports a load failure", () => {
    mockReminderSender.mockReturnValue({ isLoading: false, isError: true });
    render(<ReminderSenderCard />);
    expect(screen.getByRole("alert").textContent).toBe(
      "admin.system.reminderSender.loadFailed",
    );
  });
});
