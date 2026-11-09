import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatDate, formatDateTime } from "@/lib/format-date";
import type {
  InvestmentConfirmation,
  InvestorAgreementStatus,
  SignedInvestmentConfirmation,
} from "@/services/funding.service";
import { InvestmentConfirmationTable } from "./InvestmentConfirmationTable";
import { InvestorAgreementStep } from "./InvestorAgreementStep";
import { SignedAgreementNotice } from "./SignedAgreementNotice";
import { SignedConfirmationCard } from "./SignedConfirmationCard";
import { t } from "./test-t";

const VERSION = "investor-agreement-v0.3";
const PDF_BLOB = new Blob(["%PDF-1.3"], { type: "application/pdf" });

const mutate = vi.fn();
let upload: { mutate: typeof mutate; isPending: boolean };
let pdf: {
  data?: { blob: Blob; filename: string | null };
  isError: boolean;
  refetch: () => void;
};
const signedQuery = vi.fn();
let trancheConfirmation: {
  data?: SignedInvestmentConfirmation;
  isSuccess: boolean;
};
const confirmationPdfQuery = vi.fn();
vi.mock("@/hooks/use-funding", () => ({
  useInvestorAgreementPdf: () => pdf,
  useUploadInvestorAgreement: () => upload,
  useSignedInvestorAgreement: (signedAt: string | null, enabled: boolean) =>
    signedQuery(signedAt, enabled),
  useTrancheConfirmation: () => trancheConfirmation,
  useTrancheConfirmationPdf: (trancheId: string, enabled: boolean) =>
    confirmationPdfQuery(trancheId, enabled),
}));
vi.mock("@/hooks/use-object-url", () => ({
  useObjectUrl: (blob: Blob | null) => (blob ? "blob:agreement" : null),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
// The dialog reads the locale for its own close label.
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({ locale: "en", setLocale: vi.fn(), t }),
}));

const file = (name: string, type: string, size = 2048) =>
  new File([new Uint8Array(size)], name, { type });

const signedStatus: InvestorAgreementStatus = {
  version: VERSION,
  required: false,
  signed_at: "2026-11-08T08:30:00Z",
  signed_version: VERSION,
  file_name: "hop-dong-da-ky.pdf",
  tranche_id: "tr-1",
  signature_check: {
    verified_by: "NEAC",
    checked_at: "2026-11-09T03:31:18Z",
    signer_name: "NGUYEN VAN A",
    signer_id: "CCCD:079203001234",
    issuer_name: "FPT Certification Authority SHA256",
    signed_time: "Ngày 09 tháng 11 năm 2026, 10:30:00 [UTC+07:00]",
    name_matches: true,
  },
  party_b: {
    holder_type: "INDIVIDUAL",
    name: "NGUYEN VAN A",
    id_number: "079203001234",
    address: null,
    bank_account_number: "0123456789",
    bank_account_name: "NGUYEN VAN A",
    bank_name: "Vietcombank",
  },
};

const stepProps = {
  version: VERSION,
  trancheId: "tr-1",
  referenceCode: "FLAB12CD34",
  holdExpiresAt: "2026-11-09T05:00:00Z",
  locale: "en",
  t,
};

describe("InvestorAgreementStep", () => {
  beforeEach(() => {
    mutate.mockReset();
    upload = { mutate, isPending: false };
    pdf = {
      data: { blob: PDF_BLOB, filename: "FundLok-hop-dong.pdf" },
      isError: false,
      refetch: vi.fn(),
    };
  });

  it("previews the filled-in PDF and offers the same file to download", () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);

    expect(screen.getByTestId("investor-agreement-preview")).toHaveAttribute(
      "src",
      "blob:agreement#view=FitH",
    );
    const download = screen.getByRole("link", { name: "Download PDF" });
    expect(download).toHaveAttribute("href", "blob:agreement");
    expect(download).toHaveAttribute("download", "FundLok-hop-dong.pdf");
    expect(
      screen.getByText(`Agreement version ${VERSION}`),
    ).toBeInTheDocument();
  });

  it("uploads the signed PDF with the version it was downloaded as", () => {
    const onSigned = vi.fn();
    render(<InvestorAgreementStep {...stepProps} onSigned={onSigned} />);
    const send = screen.getByRole("button", {
      name: "Upload the signed agreement",
    });
    expect(send).toBeDisabled();

    const signed = file("hop-dong-da-ky.pdf", "application/pdf");
    fireEvent.change(screen.getByTestId("investor-agreement-input"), {
      target: { files: [signed] },
    });
    expect(screen.getByText("hop-dong-da-ky.pdf")).toBeInTheDocument();
    fireEvent.click(send);

    expect(mutate).toHaveBeenCalledOnce();
    // Signed with this commitment: its id goes with the file.
    expect(mutate.mock.calls[0][0]).toEqual({
      file: signed,
      version: VERSION,
      trancheId: "tr-1",
    });
    // The backend took it: on to the terms.
    act(() => mutate.mock.calls[0][1].onSuccess(signedStatus));
    expect(onSigned).toHaveBeenCalledWith(signedStatus);
  });

  it("refuses anything but a PDF before sending it", () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);

    fireEvent.change(screen.getByTestId("investor-agreement-input"), {
      target: { files: [file("scan.png", "image/png")] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Upload the signed agreement as a PDF file.",
    );
    expect(
      screen.getByRole("button", { name: "Upload the signed agreement" }),
    ).toBeDisabled();
  });

  it("says when the PDF came back without a digital signature", () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);
    fireEvent.change(screen.getByTestId("investor-agreement-input"), {
      target: { files: [file("unsigned.pdf", "application/pdf")] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Upload the signed agreement" }),
    );

    act(() =>
      mutate.mock.calls[0][1].onError({ code: "INVESTOR_AGREEMENT_UNSIGNED" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This PDF has no digital signature.",
    );
  });

  it("shows NEAC's own reason when it does not accept the signature", () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);
    fireEvent.change(screen.getByTestId("investor-agreement-input"), {
      target: { files: [file("signed.pdf", "application/pdf")] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Upload the signed agreement" }),
    );

    act(() =>
      mutate.mock.calls[0][1].onError({
        code: "INVESTOR_AGREEMENT_SIGNATURE_INVALID",
        message: "NEAC: Chữ ký: Không hợp lệ",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "NEAC does not confirm this digital signature as valid. NEAC: Chữ ký: Không hợp lệ",
    );
  });

  it("says the commitment is held, nothing paid, and by when to sign", () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);

    expect(screen.getByTestId("investor-agreement-held")).toHaveTextContent(
      `Commitment FLAB12CD34 is held; no money has moved. Sign and upload the agreement before ${formatDateTime("2026-11-09T05:00:00Z", "en")}`,
    );
  });
});

describe("InvestmentConfirmationTable", () => {
  const confirmation: InvestmentConfirmation = {
    listing_id: "1f2e3d4c-0000-4000-8000-000000000001",
    listing_ref: "1F2E3D4C",
    sme_name: "Delta Foods JSC",
    amount_vnd: 20_000_000,
    annual_rate_pct: "16.000",
    term_months: 4,
    service_fee_vnd: 166_666,
    service_fee_bps_per_year: 250,
    expected_disbursement_date: "2026-11-09",
  };

  it("fills every row of the Annex for this commitment", () => {
    render(
      <InvestmentConfirmationTable
        confirmation={confirmation}
        isLoading={false}
        onRetry={vi.fn()}
        locale="vi"
        t={t}
      />,
    );
    const rows = within(
      screen.getByTestId("investment-confirmation-table"),
    ).getAllByRole("row");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Mục / ItemGiá trị / Value",
      "Mã khoản gọi vốn / Listing ID1F2E3D4C",
      "Doanh nghiệp / SMEDelta Foods JSC",
      "Số tiền cam kết / Committed amount (P)20.000.000 VND",
      "Lãi suất, thời hạn / Rate, term16% a year, 4 months",
      "Phí dịch vụ dự kiến / Expected service feeP × 2.5% × M / 12 = 166.666 VND + VAT",
      "Ngày giải ngân dự kiến / Expected Disbursement Date09/11/2026",
    ]);
  });

  it("offers a retry when the Annex could not be loaded", async () => {
    const onRetry = vi.fn();
    render(
      <InvestmentConfirmationTable
        confirmation={undefined}
        isLoading={false}
        onRetry={onRetry}
        locale="en"
        t={t}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The Investment Confirmation could not be loaded",
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("SignedAgreementNotice", () => {
  const signedAt = signedStatus.signed_at as string;

  beforeEach(() => {
    signedQuery.mockReset();
    signedQuery.mockImplementation((_at: string, enabled: boolean) => ({
      data: enabled
        ? { blob: PDF_BLOB, filename: "hop-dong-da-ky.pdf" }
        : undefined,
      isError: false,
    }));
  });

  it("reminds the investor of the agreement signed and opens the signed copy", async () => {
    render(
      <SignedAgreementNotice
        signedAt={signedAt}
        version={VERSION}
        fileName="hop-dong-da-ky.pdf"
        signatureCheck={signedStatus.signature_check}
        locale="en"
        t={t}
      />,
    );
    const date = formatDate(signedAt, "en");
    expect(screen.getByTestId("signed-agreement-neac")).toHaveTextContent(
      "Verified with NEAC: a valid digital signature by NGUYEN VAN A (CCCD:079203001234), issued by FPT Certification Authority SHA256.",
    );
    expect(screen.getByTestId("signed-agreement-notice")).toHaveTextContent(
      `uploaded it on ${date} (version ${VERSION})`,
    );
    // Nothing is fetched until they ask to see it.
    expect(signedQuery).toHaveBeenLastCalledWith(signedAt, false);

    await userEvent.click(
      screen.getByRole("button", { name: "View the signed agreement" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(signedQuery).toHaveBeenLastCalledWith(signedAt, true);
    expect(
      within(dialog).getByTestId("signed-agreement-preview"),
    ).toHaveAttribute("src", "blob:agreement#view=FitH");
    expect(dialog).toHaveTextContent(
      `Uploaded on ${date} · hop-dong-da-ky.pdf · version ${VERSION}`,
    );
  });
});

describe("SignedConfirmationCard", () => {
  const confirmed: SignedInvestmentConfirmation = {
    id: "c-1",
    tranche_id: "tr-1",
    reference_code: "FLAB12CD34",
    listing_id: "d2951dcd-0000-4000-8000-000000000001",
    listing_ref: "D2951DCD",
    sme_name: "Công ty TNHH Vận Tải Sông Hàn",
    amount_vnd: 10_000_000,
    annual_rate_pct: "13.752",
    term_months: 6,
    service_fee_vnd: 125_000,
    service_fee_bps_per_year: 250,
    expected_disbursement_date: "2026-11-09",
    confirmed_at: "2026-11-09T03:05:00Z",
    agreement_version: VERSION,
  };

  beforeEach(() => {
    confirmationPdfQuery.mockReset();
    confirmationPdfQuery.mockImplementation(
      (_id: string, enabled: boolean) => ({
        data: enabled
          ? { blob: PDF_BLOB, filename: "FundLok-xac-nhan-dau-tu.pdf" }
          : undefined,
        isError: false,
      }),
    );
  });

  it("shows the filled-in Annex of this ticket, with its PDF to view and save", async () => {
    trancheConfirmation = { data: confirmed, isSuccess: true };
    render(<SignedConfirmationCard trancheId="tr-1" locale="en" t={t} />);

    const card = screen.getByTestId("signed-confirmation");
    expect(card).toHaveTextContent(
      "Listing D2951DCD · Công ty TNHH Vận Tải Sông Hàn · 10.000.000 VND",
    );
    expect(card).toHaveTextContent(
      "13,752% a year · 6 months · expected service fee 125.000 VND + VAT",
    );
    expect(card).toHaveTextContent(
      `Expected disbursement ${formatDate("2026-11-09T00:00:00", "en")}`,
    );
    expect(screen.getByRole("link", { name: "Download PDF" })).toHaveAttribute(
      "download",
      "FundLok-xac-nhan-dau-tu.pdf",
    );

    await userEvent.click(screen.getByRole("button", { name: "View" }));
    expect(
      within(screen.getByRole("dialog")).getByTestId(
        "signed-confirmation-preview",
      ),
    ).toHaveAttribute("src", "blob:agreement#view=FitH");
  });

  it("shows nothing for a ticket from before confirmations were kept", () => {
    trancheConfirmation = { data: undefined, isSuccess: false };
    const { container } = render(
      <SignedConfirmationCard trancheId="tr-old" locale="en" t={t} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(confirmationPdfQuery).toHaveBeenLastCalledWith("tr-old", false);
  });
});
