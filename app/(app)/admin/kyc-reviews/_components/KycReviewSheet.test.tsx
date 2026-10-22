import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { KycReviewSheet } from "./KycReviewSheet";
import type { AdminKycVerification } from "@/services/admin.service";

const mutateAsyncMock = vi.fn();
const toastMock = vi.fn();

let mockVerificationData: AdminKycVerification | null = null;
const mockLoading = false;
const mockError = false;

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => ({ data: { id: "admin-1" } }),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminKycVerification: () => ({
    data: mockVerificationData,
    isLoading: mockLoading,
    isError: mockError,
  }),
  useResolveKycVerification: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
  useAdminKycImageUrl: () => ({
    data: { url: "http://example.com/img.jpg" },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

const baseVerification: AdminKycVerification = {
  id: "v-1",
  status: "MANUAL_REVIEW",
  user: {
    id: "user-1",
    email: "user@example.com",
    full_name: "Nguyen Van A",
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
  },
  person_number: "012345678901",
  full_name: "NGUYEN VAN A",
  date_of_birth: "01/01/1990",
  face_match_score: 0.95,
  created_at: "2026-02-01T00:00:00Z",
  is_approved: false,
  rejection_reason: null,
  provider_checked: true,
  conflicts: [
    {
      verification_id: "v-other",
      user: {
        id: "user-2",
        email: "other@example.com",
        full_name: "Nguyen Van B",
        status: "ACTIVE",
        created_at: "2025-01-01T00:00:00Z",
      },
      full_name: "NGUYEN VAN A",
      date_of_birth: "01/01/1990",
      approved_at: "2025-06-01T00:00:00Z",
    },
  ],
};

describe("KycReviewSheet conflict acknowledgement and override note", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerificationData = { ...baseVerification };
  });

  it("blocks approval until conflict is acknowledged and note has at least 20 chars", async () => {
    render(<KycReviewSheet verificationId="v-1" onOpenChange={vi.fn()} />);

    const approveBtn = screen.getByRole("button", {
      name: /admin\.kycReviews\.approve/i,
    });
    expect(approveBtn).toBeDisabled();

    // Check acknowledgement checkbox
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Still disabled because note is empty (< 20 chars)
    expect(approveBtn).toBeDisabled();

    // Type a short note (10 chars)
    const textarea = screen.getByRole("textbox", {
      name: /admin\.kycReviews\.overrideNotePlaceholder/i,
    });
    fireEvent.change(textarea, { target: { value: "Short note" } });
    expect(approveBtn).toBeDisabled();
    expect(
      screen.getByText(/admin\.kycReviews\.overrideNoteRequired/i),
    ).toBeInTheDocument();

    // Type >= 20 characters
    fireEvent.change(textarea, {
      target: {
        value: "This is a legitimate duplicate account approved by ops",
      },
    });
    expect(approveBtn).not.toBeDisabled();

    // Click approve
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "v-1",
        body: {
          decision: "APPROVED",
          note: "This is a legitimate duplicate account approved by ops",
          acknowledged_conflict_ids: ["v-other"],
        },
      });
    });
  });

  it("handles 409 ID_CONFLICT_ACK_REQUIRED response from server", async () => {
    // Manual review attempt without prior known conflicts
    mockVerificationData = {
      ...baseVerification,
      provider_checked: false,
      person_number: null,
      full_name: null,
      date_of_birth: null,
      conflicts: [],
    };

    mutateAsyncMock.mockRejectedValueOnce({
      code: "ID_CONFLICT_ACK_REQUIRED",
      conflicts: [
        {
          verification_id: "v-conflict-server",
          user: {
            id: "user-3",
            email: "server@example.com",
            full_name: "Existing Person",
            status: "ACTIVE",
            created_at: "2025-01-01T00:00:00Z",
          },
          full_name: "Existing Person",
          date_of_birth: "01/01/1990",
          approved_at: "2025-06-01T00:00:00Z",
        },
      ],
    });

    render(<KycReviewSheet verificationId="v-1" onOpenChange={vi.fn()} />);

    // Fill in manual details
    const inputs = screen.getAllByRole("textbox");
    // input 0: person number, input 1: full name, input 2: dob, input 3: textarea note
    fireEvent.change(inputs[0], { target: { value: "012345678901" } });
    fireEvent.change(inputs[1], { target: { value: "NGUYEN VAN A" } });

    const approveBtn = screen.getByRole("button", {
      name: /admin\.kycReviews\.approve/i,
    });
    expect(approveBtn).not.toBeDisabled();

    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "admin.kycReviews.conflictWarningTitle",
        }),
      );
    });

    // Conflict section and checkbox should now appear
    expect(
      screen.getByText("admin.kycReviews.conflictHeading"),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });
});
