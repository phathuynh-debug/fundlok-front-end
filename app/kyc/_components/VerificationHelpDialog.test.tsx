import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
} from "@testing-library/react";
import { VerificationHelpDialog } from "./VerificationHelpDialog";
import {
  useVerificationFailures,
  MAX_VERIFICATION_FAILURES,
} from "./use-verification-failures";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

describe("useVerificationFailures hook", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("starts with 0 failures when session storage is empty", () => {
    const { result } = renderHook(() => useVerificationFailures("kyc"));
    expect(result.current.failureCount).toBe(0);
    expect(result.current.hasReachedMaxFailures).toBe(false);
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("increments failure count and triggers dialog when threshold reached", () => {
    const { result } = renderHook(() => useVerificationFailures("kyc"));

    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.failureCount).toBe(1);
    expect(result.current.hasReachedMaxFailures).toBe(false);
    expect(result.current.isDialogOpen).toBe(false);

    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.failureCount).toBe(2);
    expect(result.current.hasReachedMaxFailures).toBe(false);
    expect(result.current.isDialogOpen).toBe(false);

    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.failureCount).toBe(3);
    expect(result.current.hasReachedMaxFailures).toBe(true);
    expect(result.current.isDialogOpen).toBe(true);
  });

  it("resets failures and clears sessionStorage", () => {
    const { result } = renderHook(() => useVerificationFailures("kyc"));

    act(() => {
      result.current.recordFailure();
      result.current.recordFailure();
      result.current.recordFailure();
    });
    expect(result.current.failureCount).toBe(MAX_VERIFICATION_FAILURES);

    act(() => {
      result.current.resetFailures();
    });
    expect(result.current.failureCount).toBe(0);
    expect(result.current.hasReachedMaxFailures).toBe(false);
    expect(result.current.isDialogOpen).toBe(false);
    expect(window.sessionStorage.getItem("fundlok_kyc_failures")).toBeNull();
  });
});

describe("VerificationHelpDialog", () => {
  it("renders modal content and support link pointing to /contact?purpose=support", () => {
    const onOpenChange = vi.fn();
    render(
      <VerificationHelpDialog
        open={true}
        onOpenChange={onOpenChange}
        flow="kyc"
      />,
    );

    expect(screen.getByText("kyc.helpDialog.title")).toBeDefined();
    expect(screen.getByText("kyc.helpDialog.kycDescription")).toBeDefined();

    const contactLink = screen
      .getByText("kyc.helpDialog.contactBtn")
      .closest("a");
    expect(contactLink).toBeDefined();
    expect(contactLink?.getAttribute("href")).toBe("/contact?purpose=support");
  });

  it("renders kyb description when flow is kyb", () => {
    render(
      <VerificationHelpDialog open={true} onOpenChange={vi.fn()} flow="kyb" />,
    );

    expect(screen.getByText("kyc.helpDialog.kybDescription")).toBeDefined();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <VerificationHelpDialog
        open={true}
        onOpenChange={onOpenChange}
        flow="kyc"
      />,
    );

    const closeBtn = screen.getByText("kyc.helpDialog.closeBtn");
    fireEvent.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
