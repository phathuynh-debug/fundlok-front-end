import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReviewRow } from "./ReviewRow";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import type { DocumentKey, DocumentUpload } from "./useLoanApplication";

// ReviewRow reads everything from context, so we mock the context hook and feed
// it a controlled value. This is how to unit-test the context-driven components
// in this folder without standing up the whole provider + React Query.
vi.mock(
  "@/app/dashboard/_components/loan-application/LoanApplicationContext",
  () => ({
    useLoanApplicationContext: vi.fn(),
  }),
);
vi.mock("./LoanApplicationContext", () => ({
  useLoanApplicationContext: vi.fn(),
}));

const emptyDoc = (): DocumentUpload => ({
  file: null,
  status: "idle",
  progress: 0,
  fileKey: null,
  error: null,
  errorKind: null,
});

// Build a context value with only the fields ReviewRow touches; cast through
// `unknown` since we deliberately provide a partial of the large context type.
function mockContext(docKey: DocumentKey, doc: Partial<DocumentUpload>) {
  const openPreview = vi.fn();
  const retryUpload = vi.fn();
  const goToStep = vi.fn();
  const value = {
    documents: { [docKey]: { ...emptyDoc(), ...doc } },
    busy: false,
    isSending: false,
    isFinalizing: false,
    t: (key: string) => key, // echo the key so we can assert on it
    openPreview,
    retryUpload,
    goToStep,
    stepForDocument: () => 5,
  };
  vi.mocked(useLoanApplicationContext).mockReturnValue(
    value as unknown as ReturnType<typeof useLoanApplicationContext>,
  );
  return { openPreview, retryUpload, goToStep };
}

describe("ReviewRow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the label and a Preview action for a staged, previewable file", () => {
    mockContext("cicReport", {
      status: "ready",
      file: new File(["x"], "cic-report.pdf", { type: "application/pdf" }),
    });

    render(<ReviewRow docKey="cicReport" label="CIC Credit Report" />);

    expect(screen.getByText("CIC Credit Report")).toBeInTheDocument();
    expect(screen.getByText("cic-report.pdf · 0.00 MB")).toBeInTheDocument();
    // "ready to send" status + a preview button (pdf is previewable).
    expect(screen.getByText("dashboard.sme.readyToSend")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dashboard\.sme\.preview/ }),
    ).toBeInTheDocument();
  });

  it("prompts to add the document and jumps to its step when none is selected", async () => {
    const { goToStep } = mockContext("cicReport", {
      status: "idle",
      file: null,
    });

    render(<ReviewRow docKey="cicReport" label="CIC Credit Report" />);

    expect(
      screen.getByText("dashboard.sme.notSelectedYet"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /dashboard\.sme\.clickToUpload/ }),
    );
    expect(goToStep).toHaveBeenCalledWith(5);
  });

  it("retries the upload for a failed document", async () => {
    const { retryUpload } = mockContext("cicReport", {
      status: "error",
      errorKind: "upload",
      error: "Upload failed",
      file: new File(["x"], "cic-report.pdf", { type: "application/pdf" }),
    });

    render(<ReviewRow docKey="cicReport" label="CIC Credit Report" />);

    expect(screen.getByText("Upload failed")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /dashboard\.sme\.retryUpload/ }),
    );
    expect(retryUpload).toHaveBeenCalledWith("cicReport");
  });
});
