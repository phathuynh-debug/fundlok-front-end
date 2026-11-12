import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { ConsentClient } from "./consent-client";

const mockSendCode = vi.fn();
const mockAccept = vi.fn();
const mockReplace = vi.fn();
let mockNext: string | null = "/dashboard";

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(mockNext ? { next: mockNext } : {}),
}));

vi.mock("@/components/locale-switcher", () => ({
  LocaleSwitcher: () => null,
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/use-authentication", () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-consent", () => ({
  useSendConsentCode: () => ({ mutateAsync: mockSendCode, isPending: false }),
  useAcceptConsent: () => ({ mutateAsync: mockAccept, isPending: false }),
}));

const originalLocation = window.location;

async function acceptWithCode() {
  for (const box of screen.getAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(
    screen.getByRole("button", { name: "auth.consent.sendCode" }),
  );
  const code = await screen.findByRole("textbox");
  fireEvent.change(code, { target: { value: "123456" } });
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "auth.consent.accept" }),
    );
  });
}

describe("ConsentClient", () => {
  beforeEach(() => {
    mockSendCode.mockReset().mockResolvedValue({
      sent_to: "ph***@fundlok.com",
      expires_in_seconds: 600,
      resend_after_seconds: 60,
    });
    mockAccept.mockReset().mockResolvedValue({
      version: "v1",
      required: false,
      accepted_at: "2026-11-12T08:00:00Z",
    });
    mockReplace.mockReset();
    mockNext = "/dashboard";
    // jsdom's location cannot be spied on directly.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, replace: mockReplace },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  // Regression: router.replace replayed the client router's remembered
  // "/dashboard → /consent" redirect, so the page stayed put until a reload.
  it("leaves with a full page load once accepted", async () => {
    render(<ConsentClient />);
    await acceptWithCode();

    expect(mockAccept).toHaveBeenCalledWith(
      expect.objectContaining({ code: "123456", terms: true }),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"));
    // Busy until the page goes, so a second click cannot resubmit.
    const accept = screen.getByRole("button", {
      name: "auth.consent.accepting",
    }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
  });

  it("goes back to where the user was headed, never off-site", async () => {
    mockNext = "/dashboard/loans?tab=active";
    const { unmount } = render(<ConsentClient />);
    await acceptWithCode();
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/loans?tab=active"),
    );
    unmount();

    mockReplace.mockReset();
    mockNext = "//evil.example";
    render(<ConsentClient />);
    await acceptWithCode();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"));
  });

  it("stays on the page when the code is refused", async () => {
    mockAccept.mockRejectedValue({ status: 400, code: "CONSENT_CODE_INVALID" });
    render(<ConsentClient />);
    await acceptWithCode();

    expect(mockReplace).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: "auth.consent.accept",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true); // the code was cleared, so it waits for a new one
  });
});
