import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import enDictionary from "@/lib/i18n/en.json";
import type {
  AdminApplicationDocument,
  AdminSignatureCheck,
} from "@/services/admin.service";
import { NeacCheckPanel } from "./NeacCheckPanel";

const mutation = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  error: null as unknown,
  data: undefined as AdminSignatureCheck | undefined,
};
vi.mock("@/hooks/use-admin", () => ({
  useCheckDocumentSignature: () => mutation,
}));

const t = (key: string) => {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      enDictionary,
    );
  return typeof value === "string" ? value : key;
};

const agreement = (
  signature_check: AdminSignatureCheck | null,
  status = "UPLOADED",
): AdminApplicationDocument => ({
  id: "doc-1",
  document_type: "sme_service_agreement",
  original_filename: "hop-dong-da-ky.pdf",
  content_type: "application/pdf",
  file_size_bytes: 120_000,
  status,
  uploaded_at: "2026-11-09T03:00:00Z",
  signature_check,
});

const verified: AdminSignatureCheck = {
  status: "VERIFIED",
  checked_at: "2026-11-09T04:00:00Z",
  right_document: true,
  application_ref: "3F2A9C1B",
  agreement_version: "sme-agreement-v0.3",
  signer_matches: true,
  name_matches: true,
  expected_tax_code: "0319911223",
  expected_name: "CÔNG TY TNHH AGREEMENT TEST",
  expected_source: "KYB",
  signer_name: "CONG TY TNHH AGREEMENT TEST",
  signer_id: "MST:0319911223",
  issuer_name: "FPT Certification Authority SHA256",
  signed_time: "Ngày 09 tháng 11 năm 2026, 11:00:00 [UTC+07:00]",
  certificate_validity: "Thời điểm có hiệu lực: 2026-03-18",
  ocsp: "Chứng thư số chưa bị thu hồi. [http://ocsp3.fis.com.vn]",
  crl: null,
  problems: [],
  neac_message: "Success",
};

const renderPanel = (document: AdminApplicationDocument) =>
  render(
    <NeacCheckPanel document={document} projectId="p-1" locale="en" t={t} />,
  );

const marks = () =>
  within(screen.getByTestId("neac-check"))
    .getAllByRole("listitem")
    .filter((li) => li.hasAttribute("data-mark"))
    .map((li) => li.getAttribute("data-mark"));

describe("NeacCheckPanel", () => {
  beforeEach(() => {
    mutation.mutate.mockReset();
    Object.assign(mutation, {
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
    });
  });

  it("shows a valid agreement signed by the company as verified", () => {
    renderPanel(agreement(verified));

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(marks()).toEqual(["ok", "ok", "ok"]);
    expect(
      screen.getByText(/reference 3F2A9C1B, version sme-agreement-v0\.3/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Signed by the company: tax code 0319911223/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("FPT Certification Authority SHA256"),
    ).toBeInTheDocument();
    // NEAC's responder URL is dropped; its sentence stays.
    expect(
      screen.getByText("Chứng thư số chưa bị thu hồi."),
    ).toBeInTheDocument();
    // Already checked: nothing runs by itself.
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("flags a validly signed file that is not this application's agreement, signed by someone else", () => {
    renderPanel(
      agreement({
        ...verified,
        right_document: false,
        signer_matches: false,
        name_matches: false,
        signer_name: "CÔNG TY CỔ PHẦN FUNDLOK",
        signer_id: "MST:1501167629",
      }),
    );

    expect(screen.getByText("Needs review")).toBeInTheDocument();
    expect(marks()).toEqual(["ok", "fail", "fail"]);
    expect(
      screen.getByText(/Reference 3F2A9C1B and version .* not found/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the certificate carries MST:1501167629/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /differs from the company's \(CÔNG TY TNHH AGREEMENT TEST\)/,
      ),
    ).toBeInTheDocument();
  });

  it("lists NEAC's reasons when it does not accept the signature", () => {
    renderPanel(
      agreement({
        ...verified,
        status: "INVALID",
        problems: ["Chữ ký: Không hợp lệ"],
      }),
    );

    expect(screen.getByText("Needs review")).toBeInTheDocument();
    expect(marks()[0]).toBe("fail");
    expect(screen.getByText("NEAC reports:")).toBeInTheDocument();
    expect(screen.getByText("Chữ ký: Không hợp lệ")).toBeInTheDocument();
  });

  it("says NEAC did not answer, leaving the signer unmatched", () => {
    renderPanel(
      agreement({
        ...verified,
        status: "UNAVAILABLE",
        signer_matches: false,
        name_matches: false,
        signer_name: null,
        signer_id: null,
        issuer_name: null,
      }),
    );

    expect(screen.getByText("Not checked yet")).toBeInTheDocument();
    expect(marks()).toEqual(["unknown", "ok", "unknown"]);
    expect(screen.queryByText("Signer")).not.toBeInTheDocument();
  });

  it("runs the check by itself the first time, and again on demand", async () => {
    const user = userEvent.setup();
    const { rerender } = renderPanel(agreement(null));
    expect(mutation.mutate).toHaveBeenCalledTimes(1);
    expect(mutation.mutate).toHaveBeenCalledWith("doc-1");

    // A re-render that still has no verdict (say, the request failed) does
    // not send it again.
    rerender(
      <NeacCheckPanel
        document={agreement(null)}
        projectId="p-1"
        locale="en"
        t={t}
      />,
    );
    expect(mutation.mutate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Check with NEAC" }));
    expect(mutation.mutate).toHaveBeenCalledTimes(2);
  });

  it("shows progress while NEAC is checking", () => {
    mutation.isPending = true;
    renderPanel(agreement(verified));

    expect(screen.getByRole("status")).toHaveTextContent(
      /Sending the file to NEAC/,
    );
    expect(
      screen.getByRole("button", { name: "Check again with NEAC" }),
    ).toBeDisabled();
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  describe("the Standing Offer", () => {
    const offer = (signature_check: AdminSignatureCheck) => ({
      ...agreement(signature_check),
      document_type: "sme_standing_offer",
      original_filename: "de-nghi-da-ky.pdf",
    });
    const offerVerified: AdminSignatureCheck = {
      ...verified,
      agreement_version: "standing-offer-v0.3.1",
      document_type: "sme_standing_offer",
      terms_match: true,
      check_code: "F56A-7205-F9C1",
      guarantor_required: true,
      guarantor_matches: true,
      guarantor_expected_id: "079123456789",
      guarantor_expected_name: "TRAN VAN OWNER",
      guarantor_name: "TRAN VAN OWNER",
      guarantor_id: "CCCD:079123456789",
      guarantor_name_matches: true,
      guarantor_problems: [],
    };

    it("shows both signatures and the check code as verified", () => {
      renderPanel(offer(offerVerified));

      expect(screen.getByText("Verified")).toBeInTheDocument();
      // NEAC, document, company, guarantor, check code.
      expect(marks()).toEqual(["ok", "ok", "ok", "ok", "ok"]);
      expect(
        screen.getByText(
          /Signed by the Personal Guarantor too: ID 079123456789/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Carries today's check code F56A-7205-F9C1/),
      ).toBeInTheDocument();
      expect(screen.getByText("Personal Guarantor")).toBeInTheDocument();
    });

    it("needs review without the guarantor's own signature", () => {
      renderPanel(
        offer({
          ...offerVerified,
          guarantor_matches: false,
          guarantor_name: null,
          guarantor_id: null,
        }),
      );

      expect(screen.getByText("Needs review")).toBeInTheDocument();
      expect(marks()).toEqual(["ok", "ok", "ok", "fail", "ok"]);
      expect(
        screen.getByText(/No valid signature of the Personal Guarantor/),
      ).toBeInTheDocument();
    });

    it("needs review when the copy no longer carries today's check code", () => {
      renderPanel(offer({ ...offerVerified, terms_match: false }));

      expect(screen.getByText("Needs review")).toBeInTheDocument();
      expect(marks()).toEqual(["ok", "ok", "ok", "ok", "fail"]);
    });
  });

  it("does nothing for an upload that never landed", () => {
    renderPanel(agreement(null, "PENDING"));

    expect(screen.queryByTestId("neac-check")).not.toBeInTheDocument();
    expect(mutation.mutate).not.toHaveBeenCalled();
  });
});
