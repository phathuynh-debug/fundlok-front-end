import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MobileKycClient } from "./mobile-kyc-client";

let mockSearchParams = new URLSearchParams();
const mockSubmit = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock("../_components/gverify/useGVerifyKyc", () => ({
  useGVerifyKyc: () => ({
    images: {
      front: { file: new File([], "f.jpg"), previewUrl: "blob:f", error: null },
      back: { file: new File([], "b.jpg"), previewUrl: "blob:b", error: null },
      portrait: {
        file: new File([], "p.jpg"),
        previewUrl: "blob:p",
        error: null,
      },
    },
    setFile: vi.fn(),
    reset: vi.fn(),
    allReady: true,
    submit: mockSubmit,
    submitting: false,
  }),
}));

vi.mock("../_components/gverify/CaptureTabs", () => ({
  CaptureTabs: () => <div data-testid="capture-tabs" />,
}));

vi.mock("../_components/ManualReviewNotice", () => ({
  ManualReviewNotice: () => <div data-testid="manual-review-notice" />,
}));

vi.mock("@/hooks/use-gverify", () => ({
  useVerificationMode: () => ({
    data: { mode: "AUTOMATIC" },
  }),
}));

vi.mock("../_components/use-verification-failures", () => ({
  useVerificationFailures: () => ({
    failureCount: 0,
    isDialogOpen: false,
    setIsDialogOpen: vi.fn(),
    recordFailure: vi.fn(),
    resetFailures: vi.fn(),
  }),
}));

describe("MobileKycClient manual review mode and error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("token=valid-token&mode=MANUAL");
  });

  it("displays ManualReviewNotice and manual consent text when mode=MANUAL", () => {
    render(<MobileKycClient />);

    expect(screen.getByTestId("manual-review-notice")).toBeInTheDocument();
    expect(screen.getByText("kyc.gv.consentManual")).toBeInTheDocument();
  });

  it("passes expected_mode: MANUAL to submit", async () => {
    mockSubmit.mockResolvedValueOnce({
      status: "APPROVED",
      is_approved: true,
    });

    render(<MobileKycClient />);

    const submitBtn = screen.getByRole("button", {
      name: /kyc\.gv\.submitBtn/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        expected_mode: "MANUAL",
      });
    });
  });

  it("handles 409 VERIFICATION_MODE_CHANGED gracefully", async () => {
    mockSubmit.mockRejectedValueOnce({
      code: "VERIFICATION_MODE_CHANGED",
    });

    render(<MobileKycClient />);

    const submitBtn = screen.getByRole("button", {
      name: /kyc\.gv\.submitBtn/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("kyc.modeChanged")).toBeInTheDocument();
    });
  });
});
