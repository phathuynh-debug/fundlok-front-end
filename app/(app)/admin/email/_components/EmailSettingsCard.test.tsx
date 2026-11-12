import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmailSettingsCard } from "./EmailSettingsCard";
import { oauthErrorText } from "./email-errors";

const mockCurrentUser = vi.fn();
const mockEmailSettings = vi.fn();

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "vi",
    setLocale: vi.fn(),
    t: (key: string) => {
      if (key === "admin.email.settings.emailMismatchWarning") {
        return "Mismatch: {connectedEmail} vs {accountEmail}";
      }
      return key;
    },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

vi.mock("@/hooks/use-admin-email", () => ({
  adminEmailKeys: { all: ["admin-email"] },
  useEmailSettings: () => mockEmailSettings(),
  useSaveEmailSettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDisconnectGmail: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSendTestEmail: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStartGoogleConnect: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("EmailSettingsCard email match enforcement", () => {
  it("shows full email and enables test email when connected email matches current account", () => {
    mockCurrentUser.mockReturnValue({
      data: {
        id: "admin-1",
        email: "phat.huynh@fundlok.com",
        full_name: "Phat Huynh",
      },
    });
    mockEmailSettings.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        configured: true,
        enabled: true,
        gmail_address: "phat.huynh@fundlok.com",
        from_name: "Phat Huynh",
        needs_reconnect: false,
        connected_at: "2026-11-07T08:34:00Z",
        last_verified_at: "2026-11-07T08:38:00Z",
        updated_at: "2026-11-07T08:38:00Z",
        signature_name: null,
        signature_title: null,
        signature_phone: null,
      },
    });

    render(<EmailSettingsCard />);

    expect(screen.getByText("phat.huynh@fundlok.com")).toBeTruthy();
    expect(screen.getByText("admin.email.settings.statusOn")).toBeTruthy();
    const testBtn = screen.getByRole("button", {
      name: "admin.email.settings.sendTest",
    }) as HTMLButtonElement;
    expect(testBtn.disabled).toBe(false);
  });

  it("masks connected email and blocks sending when connected email differs from current account", () => {
    mockCurrentUser.mockReturnValue({
      data: {
        id: "admin-1",
        email: "phat.huynh@fundlok.com",
        full_name: "Phat Huynh",
      },
    });
    mockEmailSettings.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        configured: true,
        enabled: false,
        gmail_address: "other.person@fundlok.com",
        from_name: "Phat Huynh",
        needs_reconnect: false,
        connected_at: "2026-11-07T08:34:00Z",
        last_verified_at: null,
        updated_at: "2026-11-07T08:38:00Z",
        signature_name: null,
        signature_title: null,
        signature_phone: null,
      },
    });

    render(<EmailSettingsCard />);

    // Full mismatched address is masked
    expect(screen.queryByText("other.person@fundlok.com")).toBeNull();
    expect(screen.getByText("o***n@fundlok.com")).toBeTruthy();
    expect(
      screen.getByText("admin.email.settings.statusEmailMismatch"),
    ).toBeTruthy();
    expect(
      screen.getByText("Mismatch: o***n@fundlok.com vs phat.huynh@fundlok.com"),
    ).toBeTruthy();

    // Test email button and Sending On switch are blocked
    const testBtn = screen.getByRole("button", {
      name: "admin.email.settings.sendTest",
    }) as HTMLButtonElement;
    expect(testBtn.disabled).toBe(true);
    const enableSwitch = screen.getByRole("switch") as HTMLButtonElement;
    expect(enableSwitch.disabled).toBe(true);
  });

  it("tells the owner when their account sends repayment reminders", () => {
    mockCurrentUser.mockReturnValue({
      data: { id: "admin-1", email: "phat.huynh@fundlok.com" },
    });
    const settings = {
      configured: true,
      enabled: true,
      gmail_address: "phat.huynh@fundlok.com",
      from_name: "Phat Huynh",
      needs_reconnect: false,
      connected_at: "2026-11-07T08:34:00Z",
      last_verified_at: null,
      updated_at: "2026-11-07T08:38:00Z",
      signature_name: null,
      signature_title: null,
      signature_phone: null,
    };
    mockEmailSettings.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...settings, is_reminder_sender: true },
    });
    const { unmount } = render(<EmailSettingsCard />);
    expect(
      screen.getByText("admin.email.settings.reminderSenderNotice"),
    ).toBeTruthy();
    unmount();

    // Absent (a backend without the field) reads as not the sender.
    mockEmailSettings.mockReturnValue({
      isPending: false,
      isError: false,
      data: settings,
    });
    render(<EmailSettingsCard />);
    expect(
      screen.queryByText("admin.email.settings.reminderSenderNotice"),
    ).toBeNull();
  });

  it("maps email_mismatch OAuth callback error code", () => {
    expect(oauthErrorText("email_mismatch", (k) => k)).toBe(
      "admin.email.oauth.errors.email_mismatch",
    );
  });
});
