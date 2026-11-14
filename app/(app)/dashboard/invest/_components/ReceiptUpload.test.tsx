import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReceiptUpload } from "./ReceiptUpload";
import { t } from "./test-t";

const mutate = vi.fn();
let upload: {
  mutate: typeof mutate;
  isPending: boolean;
  isSuccess: boolean;
  data?: { tranche_status: string; check_status?: string; failure_codes?: string[] };
};
vi.mock("@/hooks/use-funding", () => ({
  useUploadReceipt: () => upload,
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const file = (name: string, type: string, size = 2048) =>
  new File([new Uint8Array(size)], name, { type });

describe("ReceiptUpload", () => {
  beforeEach(() => {
    mutate.mockReset();
    upload = { mutate, isPending: false, isSuccess: false };
  });

  it("uploads the chosen receipt for the ticket", () => {
    render(
      <ReceiptUpload trancheId="tr-1" submittedAt={null} locale="en" t={t} />,
    );
    const upload_ = screen.getByRole("button", { name: "Upload receipt" });
    expect(upload_).toBeDisabled();

    fireEvent.change(screen.getByTestId("receipt-input"), {
      target: { files: [file("receipt.png", "image/png")] },
    });
    expect(screen.getByText("receipt.png")).toBeInTheDocument();
    fireEvent.click(upload_);

    expect(mutate).toHaveBeenCalledOnce();
    const [vars] = mutate.mock.calls[0];
    expect(vars.trancheId).toBe("tr-1");
    expect(vars.file.name).toBe("receipt.png");
    expect(vars.idempotencyKey).toEqual(expect.any(String));
  });

  it("refuses a file that is not a PDF or an image", () => {
    render(
      <ReceiptUpload trancheId="tr-1" submittedAt={null} locale="en" t={t} />,
    );
    fireEvent.change(screen.getByTestId("receipt-input"), {
      target: { files: [file("notes.txt", "text/plain")] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Upload a PDF, PNG, JPEG or WEBP file.",
    );
    expect(
      screen.getByRole("button", { name: "Upload receipt" }),
    ).toBeDisabled();
  });

  it("says the receipt is in once it was uploaded", () => {
    render(
      <ReceiptUpload
        trancheId="tr-1"
        submittedAt="2026-11-02T07:30:00Z"
        locale="en"
        t={t}
      />,
    );
    expect(screen.getByTestId("receipt-received")).toHaveTextContent(
      "Receipt received",
    );
    expect(screen.queryByTestId("receipt-upload")).toBeNull();
  });

  it("says staff will review a receipt sent after the deadline", () => {
    upload = {
      mutate,
      isPending: false,
      isSuccess: true,
      data: { tranche_status: "UNDER_REVIEW" },
    };
    render(
      <ReceiptUpload trancheId="tr-1" submittedAt={null} locale="en" t={t} />,
    );
    expect(screen.getByTestId("receipt-received")).toHaveTextContent(
      "FundLok staff will review it",
    );
  });

  it("shows why a receipt FundLok read was rejected and asks for the right one", () => {
    upload = {
      mutate,
      isPending: false,
      isSuccess: true,
      data: {
        tranche_status: "SIGNED",
        check_status: "REJECTED",
        failure_codes: ["PAYEE_BANK_MISMATCH", "SOMETHING_NEW"],
      },
    };
    render(
      <ReceiptUpload trancheId="tr-1" submittedAt={null} locale="en" t={t} />,
    );

    expect(screen.queryByTestId("receipt-received")).toBeNull();
    const rejected = screen.getByTestId("receipt-rejected");
    expect(rejected).toHaveTextContent("Your receipt doesn't match this reservation");
    expect(rejected).toHaveTextContent("It was paid to an account at a different bank.");
    expect(rejected).toHaveTextContent("It doesn't match the transfer FundLok asked for.");
    // The upload form is still there for the right receipt.
    expect(screen.getByRole("button", { name: "Upload receipt" })).toBeInTheDocument();
  });

  it("says the transfer is confirmed when the receipt matched", () => {
    upload = {
      mutate,
      isPending: false,
      isSuccess: true,
      data: { tranche_status: "CONFIRMED", check_status: "MATCHED", failure_codes: [] },
    };
    render(
      <ReceiptUpload trancheId="tr-1" submittedAt={null} locale="en" t={t} />,
    );

    expect(screen.getByTestId("receipt-received")).toHaveTextContent(
      "It matches your reservation, so your transfer is confirmed.",
    );
  });
});
