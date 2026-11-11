import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
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
import { SignedLoanContractCard } from "./SignedLoanContractCard";
import { t } from "./test-t";

// input-otp asks the document which element is under the caret; jsdom has no
// layout, so there is never one.
document.elementFromPoint = () => null;

const VERSION = "investor-agreement-v0.3.1";
const PDF_BLOB = new Blob(["%PDF-1.3"], { type: "application/pdf" });

const sendMutate = vi.fn();
const signMutate = vi.fn();
let sendCode: { mutate: typeof sendMutate; isPending: boolean };
let sign: { mutate: typeof signMutate; isPending: boolean; isSuccess: boolean };
let loanContract: {
  data?: { blob: Blob; filename: string | null };
  isError: boolean;
  error?: { status: number };
  refetch: () => void;
};
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
  useSendInvestorAgreementCode: () => sendCode,
  useSignInvestorAgreement: () => sign,
  useWindowLoanContract: () => loanContract,
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

const signedStatus: InvestorAgreementStatus = {
  version: VERSION,
  required: false,
  phone: "0703***489",
  signed_at: "2026-11-08T08:30:00Z",
  signed_version: VERSION,
  file_name: "FundLok-hop-dong-dich-vu-nha-dau-tu.pdf",
  tranche_id: "tr-1",
  signature_check: {
    verified_by: "ZALO_OTP",
    checked_at: "2026-11-09T03:31:18Z",
    phone: "0703***489",
    signer_name: null,
    signer_id: null,
    issuer_name: null,
    signed_time: null,
    name_matches: false,
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
  phone: "0703***489" as string | null,
  locale: "en",
  t,
};

const CODE_SENT = {
  phone: "0703***489",
  channel: "zalo" as const,
  expires_in: 300,
  resend_in: 60,
};

describe("InvestorAgreementStep", () => {
  beforeEach(() => {
    sendMutate.mockReset();
    signMutate.mockReset();
    sendCode = { mutate: sendMutate, isPending: false };
    sign = { mutate: signMutate, isPending: false, isSuccess: false };
    pdf = {
      data: { blob: PDF_BLOB, filename: "FundLok-hop-dong.pdf" },
      isError: false,
      refetch: vi.fn(),
    };
  });

  /** Tick the agreement, ask for the code, and have the backend send it. */
  const askForCode = async () => {
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", {
        name: "Send the confirmation code by Zalo",
      }),
    );
    act(() => sendMutate.mock.calls.at(-1)![1].onSuccess(CODE_SENT));
  };

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

  it("sends the code only once the investor has ticked that they agree", async () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);
    const send = screen.getByRole("button", {
      name: "Send the confirmation code by Zalo",
    });
    // Where the code will go is said before asking for it.
    expect(screen.getByTestId("investor-agreement-confirm")).toHaveTextContent(
      "FundLok will send a 6-digit code by Zalo to 0703***489",
    );
    expect(send).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(send);

    expect(sendMutate).toHaveBeenCalledOnce();
    // For this commitment and the version shown.
    expect(sendMutate.mock.calls[0][0]).toEqual({
      version: VERSION,
      trancheId: "tr-1",
    });
  });

  it("confirms the agreement with the code the investor enters", async () => {
    const onSigned = vi.fn();
    render(<InvestorAgreementStep {...stepProps} onSigned={onSigned} />);
    await askForCode();
    expect(screen.getByTestId("investor-agreement-confirm")).toHaveTextContent(
      "The confirmation code was sent by Zalo to 0703***489.",
    );
    // No second code for a minute.
    expect(
      screen.getByRole("button", { name: "Send a new code in 60s" }),
    ).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), "482913");

    expect(signMutate).toHaveBeenCalledOnce();
    expect(signMutate.mock.calls[0][0]).toEqual({
      version: VERSION,
      trancheId: "tr-1",
      code: "482913",
    });
    // The backend took it: on to the transfer.
    act(() => signMutate.mock.calls[0][1].onSuccess(signedStatus));
    expect(onSigned).toHaveBeenCalledWith(signedStatus);
  });

  it("says when the code is wrong and lets them try again", async () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);
    await askForCode();
    await userEvent.type(screen.getByRole("textbox"), "000000");

    act(() => signMutate.mock.calls[0][1].onError({ code: "CODE_INCORRECT" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That code is not right. Check it and enter it again.",
    );
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("stops taking a dead code: only a new one helps", async () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);
    await askForCode();
    await userEvent.type(screen.getByRole("textbox"), "000000");

    act(() =>
      signMutate.mock.calls[0][1].onError({ code: "CODE_TOO_MANY_ATTEMPTS" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Too many incorrect attempts. Request a new code.",
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("says why the code could not be sent", async () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", {
        name: "Send the confirmation code by Zalo",
      }),
    );

    act(() => sendMutate.mock.calls[0][1].onError({ code: "PHONE_NO_ZALO" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your phone number has no Zalo account that can receive the code.",
    );
  });

  it("asks for a phone number when the account has none", () => {
    render(
      <InvestorAgreementStep {...stepProps} phone={null} onSigned={vi.fn()} />,
    );

    expect(screen.getByTestId("investor-agreement-no-phone")).toHaveTextContent(
      "Your account has no Vietnamese mobile number",
    );
    expect(
      screen.getByRole("link", { name: "Add a phone number in your profile" }),
    ).toHaveAttribute("href", "/dashboard/settings/profile");
    expect(
      screen.queryByRole("button", {
        name: "Send the confirmation code by Zalo",
      }),
    ).not.toBeInTheDocument();
  });

  it("says the commitment is held, nothing paid, and by when to confirm", () => {
    render(<InvestorAgreementStep {...stepProps} onSigned={vi.fn()} />);

    expect(screen.getByTestId("investor-agreement-held")).toHaveTextContent(
      `Commitment FLAB12CD34 is on hold and no money has moved. Read and confirm the agreement before ${formatDateTime("2026-11-09T05:00:00Z", "en")}`,
    );
  });
});

describe("SignedLoanContractCard", () => {
  beforeEach(() => {
    loanContract = {
      data: { blob: PDF_BLOB, filename: "FundLok-loan-contract-da-ky.pdf" },
      isError: false,
      refetch: vi.fn(),
    };
  });

  it("offers the Loan Contract the business signed, to read before agreeing", async () => {
    render(<SignedLoanContractCard windowId="w-1" t={t} />);

    const card = screen.getByTestId("signed-loan-contract");
    expect(card).toHaveTextContent("Loan Contract signed by the business");
    expect(
      within(card).getByRole("link", { name: "Download (PDF)" }),
    ).toHaveAttribute("download", "FundLok-loan-contract-da-ky.pdf");

    await userEvent.click(
      screen.getByRole("button", { name: "View the Loan Contract" }),
    );
    expect(
      within(screen.getByRole("dialog")).getByTestId(
        "signed-loan-contract-preview",
      ),
    ).toHaveAttribute("src", "blob:agreement#view=FitH");
  });

  it("shows nothing for a listing with no signed Loan Contract", () => {
    loanContract = {
      isError: true,
      error: { status: 404 },
      refetch: vi.fn(),
    };
    const { container } = render(
      <SignedLoanContractCard windowId="w-old" t={t} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("offers a retry when it could not be loaded", async () => {
    const refetch = vi.fn();
    loanContract = { isError: true, error: { status: 500 }, refetch };
    render(<SignedLoanContractCard windowId="w-1" t={t} />);

    expect(screen.getByTestId("signed-loan-contract")).toHaveTextContent(
      "The Loan Contract could not be loaded.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
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
        ? {
            blob: PDF_BLOB,
            filename: "FundLok-hop-dong-dich-vu-nha-dau-tu.pdf",
          }
        : undefined,
      isError: false,
    }));
  });

  it("still shows NEAC's verdict on an agreement of the earlier version", () => {
    render(
      <SignedAgreementNotice
        signedAt={signedAt}
        version="investor-agreement-v0.3"
        fileName="hop-dong-da-ky.pdf"
        signatureCheck={{
          verified_by: "NEAC",
          checked_at: "2026-11-09T03:31:18Z",
          phone: null,
          signer_name: "NGUYEN VAN A",
          signer_id: "CCCD:079203001234",
          issuer_name: "FPT Certification Authority SHA256",
          signed_time: null,
          name_matches: true,
        }}
        locale="en"
        t={t}
      />,
    );
    expect(screen.getByTestId("signed-agreement-neac")).toHaveTextContent(
      "Verified with NEAC: a valid digital signature by NGUYEN VAN A (CCCD:079203001234), issued by FPT Certification Authority SHA256.",
    );
  });

  it("reminds the investor of the agreement confirmed and opens the copy kept", async () => {
    render(
      <SignedAgreementNotice
        signedAt={signedAt}
        version={VERSION}
        fileName="FundLok-hop-dong-dich-vu-nha-dau-tu.pdf"
        signatureCheck={signedStatus.signature_check}
        locale="en"
        t={t}
      />,
    );
    const date = formatDate(signedAt, "en");
    expect(screen.getByTestId("signed-agreement-otp")).toHaveTextContent(
      "Confirmed with a code sent by Zalo to 0703***489.",
    );
    expect(screen.getByTestId("signed-agreement-notice")).toHaveTextContent(
      `You confirmed the Investor Service Agreement on ${date} (version ${VERSION})`,
    );
    // Nothing is fetched until they ask to see it.
    expect(signedQuery).toHaveBeenLastCalledWith(signedAt, false);

    await userEvent.click(
      screen.getByRole("button", { name: "View the confirmed agreement" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(signedQuery).toHaveBeenLastCalledWith(signedAt, true);
    expect(
      within(dialog).getByTestId("signed-agreement-preview"),
    ).toHaveAttribute("src", "blob:agreement#view=FitH");
    expect(dialog).toHaveTextContent(
      `Confirmed on ${date} · FundLok-hop-dong-dich-vu-nha-dau-tu.pdf · version ${VERSION}`,
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
