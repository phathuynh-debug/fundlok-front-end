"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  FileSignature,
  FileUp,
  Loader2,
  Lock,
  Megaphone,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useListingDocuments,
  useLoanContract,
  useServiceAgreement,
  useSetGuarantorAddress,
  useSignListingDocument,
  useSignedListingDocument,
  useStandingOffer,
} from "@/hooks/use-loans";
import { useObjectUrl } from "@/hooks/use-object-url";
import { useToast } from "@/hooks/use-toast";
import type { ListingDocumentKind } from "@/lib/endpoints";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import {
  SIGNED_DOCUMENT_MAX_BYTES,
  type ListingDocumentChecks,
  type ListingDocuments,
  type MissingDetail,
  type SignedListingDocument,
} from "@/services/loans.service";
import { fileSignatureCount } from "./agreement-signature";

const K = "dashboard.sme.signing";

// Upload refusals the SME can act on, by X-Error-Code (app/loans/signing.py).
const KNOWN_ERRORS = new Set([
  "SIGNING_NOT_OPEN",
  "SIGNING_ALREADY_SIGNED",
  "SIGNING_FILE_TOO_LARGE",
  "SIGNING_NOT_PDF",
  "SIGNING_UNSIGNED",
  "SIGNING_WRONG_DOCUMENT",
  "SIGNING_DOCUMENT_OUTDATED",
  "SIGNING_GUARANTOR_UNVERIFIED",
  "SIGNING_SIGNATURE_INVALID",
  "SIGNING_SIGNER_MISMATCH",
  "SIGNING_GUARANTOR_MISSING",
  "SIGNING_DETAILS_MISSING",
  "SIGNING_OFFER_FIRST",
  "NEAC_UNAVAILABLE",
]);

// Where the SME completes each missing detail. The Guarantor's address is
// entered right here; everything else comes from a verification or a setting.
const DETAIL_FIX: Record<
  Exclude<MissingDetail, "GUARANTOR_ADDRESS">,
  string
> = {
  COMPANY_NAME: "/kyc",
  ENTERPRISE_CODE: "/kyc",
  COMPANY_ADDRESS: "/kyc",
  LEGAL_REPRESENTATIVE: "/kyc",
  BANK_ACCOUNT: "/dashboard/settings/profile#bank-account",
  GUARANTOR_NAME: "/kyc",
  GUARANTOR_ID: "/kyc",
};
const ADDRESS_MIN = 8;
const ADDRESS_MAX = 300;
// Refusals whose server detail says what NEAC saw (its reasons, or who did
// sign): worth showing after our own sentence.
const WITH_DETAIL = new Set([
  "SIGNING_SIGNATURE_INVALID",
  "SIGNING_SIGNER_MISMATCH",
  "SIGNING_GUARANTOR_MISSING",
]);

const HOW_TO_SIGN = [`${K}.how1`, `${K}.how2`, `${K}.how3`] as const;

// Service Agreement first: it is the one between the SME and FundLok, and the
// Standing Offer refers to it.
const DOCUMENTS: {
  kind: ListingDocumentKind;
  key: "serviceAgreement" | "standingOffer" | "loanContract";
  field: "service_agreement" | "standing_offer" | "loan_contract";
  // Signatures the signed copy must carry at least (enterprise; enterprise +
  // the guarantor's personal one).
  signatures: number;
}[] = [
  {
    kind: "service-agreement",
    key: "serviceAgreement",
    field: "service_agreement",
    signatures: 1,
  },
  {
    kind: "standing-offer",
    key: "standingOffer",
    field: "standing_offer",
    signatures: 2,
  },
  // The template each Investor's own contract is generated from at
  // commitment; the Investor signs that one then.
  {
    kind: "loan-contract",
    key: "loanContract",
    field: "loan_contract",
    signatures: 2,
  },
];

type Translate = (key: string) => string;

/**
 * After FundLok approves a request, the SME signs the three documents the
 * approved terms go into, and signing them publishes the listing (Contract 3,
 * "Ký kết"):
 *
 * - the SME Service Agreement (Contract 2), with the enterprise's digital
 *   signature;
 * - the Standing Offer to Conclude Loan Contracts (Contract 3), with the
 *   enterprise's signature and the Personal Guarantor's personal one; and
 * - the Loan Contract template (Contract 5), signed the same way; each
 *   Investor's own contract is generated from it when they commit.
 *
 * Each is generated on the server with the approved terms, previewed and
 * downloaded here, signed outside FundLok and uploaded back; the backend
 * checks every upload with NEAC before it counts. This used to be step 4 of
 * the application wizard, before anything was approved, so the agreement went
 * out without a rate in it.
 */
export function ListingSigning({
  applicationId,
  locale,
  t,
}: {
  applicationId: string;
  locale: string;
  t: Translate;
}) {
  const status = useListingDocuments(applicationId);

  if (status.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status.isError || !status.data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-foreground">{t(`${K}.loadFailed`)}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => void status.refetch()}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          {t(`${K}.retry`)}
        </Button>
      </div>
    );
  }

  const docs = status.data;
  const signedCount = DOCUMENTS.filter((d) => docs[d.field].signed).length;

  if (docs.published) {
    // A project that went live before this step existed has nothing signed
    // here, and nothing to say about it.
    if (signedCount === 0) return null;
    return (
      <section
        aria-label={t(`${K}.publishedTitle`)}
        data-testid="listing-published"
        className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <Megaphone
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-foreground">
              {t(`${K}.publishedTitle`)}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(`${K}.publishedBody`)}
            </p>
          </div>
        </div>
        <ul className="space-y-1.5 border-t border-emerald-500/20 pt-3">
          {DOCUMENTS.filter((d) => docs[d.field].signed).map((d) => (
            <SignedRow
              key={d.kind}
              applicationId={applicationId}
              kind={d.kind}
              title={t(`${K}.${d.key}.title`)}
              signed={docs[d.field]}
              locale={locale}
              t={t}
            />
          ))}
        </ul>
      </section>
    );
  }

  if (!docs.ready) {
    // Approved by the operator, but the score run that fixes the rate is not
    // locked yet: there is nothing with terms in it to sign.
    return (
      <section
        aria-label={t(`${K}.title`)}
        data-testid="listing-signing-pending"
        className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
      >
        <FileSignature
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-foreground">{t(`${K}.title`)}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(`${K}.pending`)}
          </p>
        </div>
      </section>
    );
  }

  // The first unsigned document it can sign now opens on its own, so the SME
  // lands on the thing to do next.
  const firstUnsigned = DOCUMENTS.find(
    (d) => !docs[d.field].signed && !docs[d.field].waiting_for,
  )?.kind;
  // Every detail some unsigned document still prints as a blank, once.
  const missing = Array.from(
    new Set(
      DOCUMENTS.flatMap((d) =>
        docs[d.field].signed ? [] : (docs[d.field].missing_details ?? []),
      ),
    ),
  );

  return (
    <section
      aria-labelledby="listing-signing-title"
      data-testid="listing-signing"
      className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4
            id="listing-signing-title"
            className="flex items-center gap-2 text-base font-bold text-foreground"
          >
            <FileSignature className="h-5 w-5 shrink-0" aria-hidden />
            {t(`${K}.title`)}
          </h4>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t(`${K}.intro`)}
          </p>
        </div>
        <span
          className="shrink-0 self-start rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground"
          data-testid="listing-signing-progress"
        >
          {t(`${K}.progress`)
            .replace("{count}", String(signedCount))
            .replace("{total}", String(DOCUMENTS.length))}
        </span>
      </div>

      {missing.length > 0 && (
        <MissingDetails
          applicationId={applicationId}
          missing={missing}
          docs={docs}
          t={t}
        />
      )}

      <div className="space-y-3">
        {DOCUMENTS.map((d) => (
          <SigningDocumentCard
            // Keyed by whether it is the next one to sign, so once the first
            // is verified the second opens on its own.
            key={`${d.kind}-${d.kind === firstUnsigned}`}
            applicationId={applicationId}
            kind={d.kind}
            copyKey={`${K}.${d.key}`}
            requiredSignatures={d.signatures}
            signed={docs[d.field]}
            defaultOpen={d.kind === firstUnsigned}
            locale={locale}
            t={t}
          />
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(`${K}.blanksNote`)}
      </p>
    </section>
  );
}

/**
 * The details the documents still print as blanks, each with where to
 * complete it. The Personal Guarantor's address has no source on FundLok (the
 * eKYC does not return one), so it is entered here; the Offer and the Loan
 * Contract are generated again with it.
 */
function MissingDetails({
  applicationId,
  missing,
  docs,
  t,
}: {
  applicationId: string;
  missing: MissingDetail[];
  docs: ListingDocuments;
  t: Translate;
}) {
  const save = useSetGuarantorAddress(applicationId);
  const [address, setAddress] = useState(docs.guarantor_address ?? "");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const trimmed = address.trim().replace(/\s+/g, " ");

  const submit = () => {
    setError(null);
    if (trimmed.length < ADDRESS_MIN) {
      setError(t(`${K}.missing.addressTooShort`));
      return;
    }
    save.mutate(trimmed, {
      onSuccess: () => toast({ title: t(`${K}.missing.addressSaved`) }),
      onError: (failure) =>
        setError(
          failure.code === "SIGNING_ALREADY_SIGNED"
            ? t(`${K}.missing.addressLocked`)
            : t(`${K}.errors.generic`),
        ),
    });
  };

  return (
    <div
      className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
      data-testid="listing-missing-details"
    >
      <div className="flex items-start gap-2">
        <ClipboardList
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
          aria-hidden
        />
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-foreground">
            {t(`${K}.missing.title`)}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(`${K}.missing.body`)}
          </p>
        </div>
      </div>
      <ul className="space-y-2 pl-6 text-xs sm:text-sm">
        {missing.map((code) =>
          code === "GUARANTOR_ADDRESS" ? (
            <li key={code} className="space-y-2">
              <label
                htmlFor="guarantor-address"
                className="block font-semibold text-foreground"
              >
                {t(`${K}.missing.GUARANTOR_ADDRESS`)}
              </label>
              <p className="text-xs text-muted-foreground">
                {t(`${K}.missing.addressHint`)}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="guarantor-address"
                  data-testid="guarantor-address-input"
                  value={address}
                  maxLength={ADDRESS_MAX}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                  placeholder={t(`${K}.missing.addressPlaceholder`)}
                  className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5"
                  disabled={save.isPending}
                  onClick={submit}
                  data-testid="guarantor-address-save"
                >
                  {save.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  )}
                  {t(`${K}.missing.save`)}
                </Button>
              </div>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </li>
          ) : (
            <li
              key={code}
              className="flex flex-wrap items-center gap-x-2 gap-y-1"
            >
              <span className="font-semibold text-foreground">
                {t(`${K}.missing.${code}`)}
              </span>
              <Link
                href={DETAIL_FIX[code]}
                className="text-xs font-semibold text-foreground underline"
              >
                {t(
                  code === "BANK_ACCOUNT"
                    ? `${K}.missing.fixBank`
                    : `${K}.missing.fixVerification`,
                )}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SigningDocumentCard({
  applicationId,
  kind,
  copyKey,
  requiredSignatures,
  signed,
  defaultOpen,
  locale,
  t,
}: {
  applicationId: string;
  kind: ListingDocumentKind;
  copyKey: string;
  requiredSignatures: number;
  signed: SignedListingDocument;
  defaultOpen: boolean;
  locale: string;
  t: Translate;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);
  // The Loan Contract cites the signed Offer: it opens once that is on file.
  const waiting = !signed.signed && !!signed.waiting_for;
  const showForm = open && !signed.signed && !waiting;
  // Still printing a party's details as blanks: viewable, not yet signable.
  const blanks = signed.signed ? [] : (signed.missing_details ?? []);

  // Both hooks always run (rules of hooks); only this card's kind is enabled,
  // and only while it is open, since each is generated on every request.
  const agreementPdf = useServiceAgreement(
    applicationId,
    showForm && kind === "service-agreement",
  );
  const offerPdf = useStandingOffer(
    applicationId,
    showForm && kind === "standing-offer",
  );
  const contractPdf = useLoanContract(
    applicationId,
    showForm && kind === "loan-contract",
  );
  const pdf =
    kind === "service-agreement"
      ? agreementPdf
      : kind === "standing-offer"
        ? offerPdf
        : contractPdf;
  const url = useObjectUrl(pdf.data?.blob ?? null);
  const filename = pdf.data?.filename ?? `FundLok-${kind}.pdf`;

  const upload = useSignListingDocument(applicationId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const choose = async (picked: File | undefined) => {
    setError(null);
    setFile(null);
    if (!picked) return;
    const isPdf =
      picked.type === "application/pdf" ||
      picked.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError(t(`${K}.errors.SIGNING_NOT_PDF`));
      return;
    }
    if (picked.size > SIGNED_DOCUMENT_MAX_BYTES) {
      setError(t(`${K}.errors.SIGNING_FILE_TOO_LARGE`));
      return;
    }
    // The likeliest mistakes, caught before the upload: the PDF as downloaded,
    // and the Standing Offer with only the enterprise's signature on it.
    setChecking(true);
    try {
      const count = await fileSignatureCount(picked);
      if (count === 0) {
        setError(t(`${K}.errors.SIGNING_UNSIGNED`));
        return;
      }
      if (count < requiredSignatures) {
        setError(t(`${K}.errors.SIGNING_GUARANTOR_MISSING`));
        return;
      }
    } catch {
      // Could not read it here: leave it to the backend's check.
    } finally {
      setChecking(false);
    }
    setFile(picked);
  };

  const send = () => {
    if (!file) return;
    setError(null);
    upload.mutate(
      { kind, file },
      {
        onSuccess: (status) => {
          setFile(null);
          toast({
            title: t(
              status.published ? `${K}.publishedToast` : `${K}.uploaded`,
            ),
          });
        },
        onError: (failure) => {
          const code = failure.code ?? "";
          let message = KNOWN_ERRORS.has(code)
            ? t(`${K}.errors.${code}`)
            : t(`${K}.errors.generic`);
          if (WITH_DETAIL.has(code) && failure.message) {
            message = `${message} ${failure.message}`;
          }
          setError(message);
          toast({
            variant: "destructive",
            title: t(`${K}.failed`),
            description: message,
          });
        },
      },
    );
  };

  const busy = upload.isPending || checking;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        signed.signed ? "border-emerald-500/30" : "border-border",
      )}
      data-testid={`signing-${kind}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={signed.signed || waiting}
        aria-expanded={showForm}
        className={cn(
          "flex w-full items-start gap-3 p-4 text-left disabled:cursor-default",
          waiting && "opacity-70",
        )}
      >
        {signed.signed ? (
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
            aria-hidden
          />
        ) : waiting ? (
          <Lock
            className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : (
          <FileSignature
            className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-bold text-foreground">
            {t(`${copyKey}.title`)}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(`${copyKey}.description`)}
          </p>
          {waiting && (
            <p
              className="text-xs font-medium text-foreground/80"
              data-testid={`signing-${kind}-waiting`}
            >
              {t(`${K}.waitingForOffer`)}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            signed.signed
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {signed.signed && signed.signed_at
            ? t(`${K}.statusSigned`).replace(
                "{date}",
                formatDateTime(signed.signed_at, locale),
              )
            : waiting
              ? t(`${K}.statusLocked`)
              : t(`${K}.statusUnsigned`)}
        </span>
        {!signed.signed && !waiting && (
          <ChevronDown
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              showForm && "rotate-180",
            )}
            aria-hidden
          />
        )}
      </button>

      {signed.signed && (
        <ul className="border-t border-border/60 px-4 py-2.5">
          <SignedRow
            applicationId={applicationId}
            kind={kind}
            title={t(`${K}.signedCopy`)}
            signed={signed}
            locale={locale}
            t={t}
          />
        </ul>
      )}

      {showForm && (
        <div className="space-y-4 border-t border-border/60 p-4">
          <p className="text-xs leading-relaxed text-foreground/90 sm:text-sm">
            {t(`${copyKey}.signers`)}
          </p>
          {blanks.length > 0 && (
            <div
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200 sm:text-sm"
              data-testid={`signing-${kind}-blanks`}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                {t(`${K}.blanksBlock`).replace(
                  "{details}",
                  blanks.map((code) => t(`${K}.missing.${code}`)).join(", "),
                )}
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* The document as it will be signed. */}
            <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                <span className="truncate text-xs font-semibold text-muted-foreground">
                  {t(`${K}.previewLabel`)}
                </span>
                <Button
                  asChild={!!url}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!url}
                  className="h-8 shrink-0 gap-1.5 text-xs"
                >
                  {url ? (
                    <a href={url} download={filename}>
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      {t(`${K}.download`)}
                    </a>
                  ) : (
                    <span>
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      {t(`${K}.download`)}
                    </span>
                  )}
                </Button>
              </div>
              <div className="flex h-[420px] items-center justify-center sm:h-[520px]">
                {pdf.isError ? (
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <AlertCircle
                      className="h-6 w-6 text-destructive"
                      aria-hidden
                    />
                    <p className="text-sm text-foreground">
                      {t(`${K}.documentLoadFailed`)}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => void pdf.refetch()}
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      {t(`${K}.retry`)}
                    </Button>
                  </div>
                ) : url ? (
                  <iframe
                    src={`${url}#view=FitH`}
                    title={t(`${copyKey}.title`)}
                    className="h-full w-full bg-background"
                  />
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t(`${K}.loading`)}
                  </p>
                )}
              </div>
            </div>

            {/* How to sign it, and where it comes back. */}
            <div className="flex min-w-0 flex-col gap-4">
              <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                <h5 className="text-sm font-bold text-foreground">
                  {t(`${K}.howTitle`)}
                </h5>
                <ol className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {HOW_TO_SIGN.map((key, i) => (
                    <li key={key} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold text-foreground">
                        {i + 1}
                      </span>
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">
                  {t(`${K}.signedLabel`)}
                </p>
                <input
                  ref={inputRef}
                  id={`signed-${kind}`}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  data-testid={`signed-${kind}-input`}
                  onChange={(e) => {
                    void choose(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {file ? (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {sizeLabel(file.size)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      disabled={busy}
                      aria-label={t(`${K}.remove`)}
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                  >
                    {checking ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden />
                    )}
                    {t(`${K}.choose`)}
                  </Button>
                )}
                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive"
                  >
                    <AlertCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden
                    />
                    {error}
                  </p>
                )}
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={!file || busy || blanks.length > 0}
                  onClick={send}
                  data-testid={`signed-${kind}-send`}
                >
                  {upload.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  {upload.isPending ? t(`${K}.sending`) : t(`${K}.send`)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A signed document on file, with its signed copy fetched only when asked for
 * (it can be up to 25 MB), then offered as a download.
 */
function SignedRow({
  applicationId,
  kind,
  title,
  signed,
  locale,
  t,
}: {
  applicationId: string;
  kind: ListingDocumentKind;
  title: string;
  signed: SignedListingDocument;
  locale: string;
  t: Translate;
}) {
  const [wanted, setWanted] = useState(false);
  const copy = useSignedListingDocument(
    applicationId,
    kind,
    signed.signed_at,
    wanted,
  );
  const url = useObjectUrl(copy.data?.blob ?? null);

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <CheckCircle2
        className="h-3.5 w-3.5 shrink-0 text-emerald-500"
        aria-hidden
      />
      <span className="font-medium text-foreground">{title}</span>
      {signed.signed_at && (
        <span className="text-muted-foreground">
          {formatDateTime(signed.signed_at, locale)}
        </span>
      )}
      <span className="ml-auto">
        {url ? (
          <a
            href={url}
            download={copy.data?.filename ?? `FundLok-${kind}-signed.pdf`}
            className="inline-flex items-center gap-1 font-semibold text-foreground underline"
          >
            <Download className="h-3 w-3" aria-hidden />
            {t(`${K}.downloadSigned`)}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setWanted(true)}
            disabled={copy.isFetching}
            className="inline-flex items-center gap-1 font-semibold text-foreground underline disabled:opacity-60"
          >
            {copy.isFetching && (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            )}
            {copy.isError ? t(`${K}.retry`) : t(`${K}.viewSigned`)}
          </button>
        )}
      </span>
      {signed.checks && <AutoChecks checks={signed.checks} t={t} />}
    </li>
  );
}

/**
 * What the automatic check on upload established, one line per fact: each
 * signer's signature (by name, as their certificate gives it) and that the
 * signed copy carries the approved numbers.
 */
function AutoChecks({
  checks,
  t,
}: {
  checks: ListingDocumentChecks;
  t: Translate;
}) {
  const items = [
    ...checks.signers.map((signer) =>
      t(
        signer.role === "SME"
          ? `${K}.checks.smeSigned`
          : `${K}.checks.guarantorSigned`,
      ).replace("{name}", signer.name ?? "—"),
    ),
    ...(checks.terms_match ? [t(`${K}.checks.termsMatch`)] : []),
  ];
  return (
    <div
      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 pl-5 text-[11px] text-muted-foreground"
      data-testid="listing-auto-checks"
    >
      <span className="font-semibold text-foreground/80">
        {t(`${K}.checks.title`).replace(
          "{by}",
          checks.verified_by ?? "FundLok",
        )}
      </span>
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden />
          {item}
        </span>
      ))}
    </div>
  );
}
