"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  FileSignature,
  FileUp,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useInvestorAgreementPdf,
  useUploadInvestorAgreement,
} from "@/hooks/use-funding";
import { useObjectUrl } from "@/hooks/use-object-url";
import { useToast } from "@/hooks/use-toast";
import {
  AGREEMENT_MAX_BYTES,
  type InvestorAgreementStatus,
} from "@/services/funding.service";

const K = "investConfirm.agreement";

const HOW_TO_SIGN = [`${K}.how1`, `${K}.how2`, `${K}.how3`] as const;

// Upload failures the investor can act on, by X-Error-Code.
const KNOWN_ERRORS = new Set([
  "INVESTOR_AGREEMENT_UNSIGNED",
  "INVESTOR_AGREEMENT_OUTDATED",
  "INVESTOR_AGREEMENT_IN_USE",
  "UNSUPPORTED_TYPE",
  "FILE_TOO_LARGE",
]);

interface InvestorAgreementStepProps {
  /** The version the platform asks for, printed on the PDF to sign. */
  version: string;
  /** The signed copy was accepted: on to the terms. */
  onSigned: (status: InvestorAgreementStatus) => void;
  /** Replacing a signed copy: keep the one already uploaded instead. */
  onCancel?: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The investor's first commitment: the Investor Service Agreement (Contract
 * 4), signed the way an SME signs its service agreement. The backend fills the
 * PDF in from the verified profile and the approved bank account; the investor
 * previews it, downloads the same file, signs it with their digital signature
 * and uploads the signed copy. The backend refuses a PDF with no digital
 * signature in it, and refuses the first commitment until a signed copy is in.
 */
export function InvestorAgreementStep({
  version,
  onSigned,
  onCancel,
  t,
}: InvestorAgreementStepProps) {
  const { toast } = useToast();
  const pdf = useInvestorAgreementPdf();
  const url = useObjectUrl(pdf.data?.blob ?? null);
  const filename =
    pdf.data?.filename ?? "FundLok-hop-dong-dich-vu-nha-dau-tu.pdf";
  const upload = useUploadInvestorAgreement();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    const isPdf =
      picked.type === "application/pdf" ||
      picked.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError(t(`${K}.errors.UNSUPPORTED_TYPE`));
      return;
    }
    if (picked.size > AGREEMENT_MAX_BYTES) {
      setError(t(`${K}.errors.FILE_TOO_LARGE`));
      return;
    }
    setFile(picked);
  };

  const send = () => {
    if (!file) return;
    setError(null);
    upload.mutate(
      { file, version },
      {
        onSuccess: (status) => {
          toast({ title: t(`${K}.uploaded`) });
          onSigned(status);
        },
        onError: (failure) => {
          const code = failure.code ?? "";
          const message = KNOWN_ERRORS.has(code)
            ? t(`${K}.errors.${code}`)
            : t(`${K}.errors.generic`);
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

  return (
    <section className="space-y-5" aria-labelledby="investor-agreement-title">
      <div className="space-y-1">
        <h2
          id="investor-agreement-title"
          className="flex items-center gap-2 text-lg font-bold text-foreground"
        >
          <FileSignature className="h-5 w-5 text-muted-foreground" />
          {t(`${K}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground">{t(`${K}.intro`)}</p>
      </div>

      {/* The agreement as the investor will sign it. */}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-muted/30">
        <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
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
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
              <p className="text-sm text-foreground">{t(`${K}.loadFailed`)}</p>
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
              title={t(`${K}.title`)}
              className="h-full w-full bg-background"
              data-testid="investor-agreement-preview"
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
      <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
        <h3 className="text-sm font-bold text-foreground">
          {t(`${K}.howTitle`)}
        </h3>
        <ol className="space-y-2 text-sm leading-relaxed text-muted-foreground">
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

      <div className="space-y-3 rounded-xl border p-4">
        <p className="text-sm font-semibold text-foreground">
          {t(`${K}.signedLabel`)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          data-testid="investor-agreement-input"
          onChange={(e) => {
            choose(e.target.files?.[0]);
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
              aria-label={t(`${K}.remove`)}
              disabled={upload.isPending}
              onClick={() => setFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-dashed"
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            {t(`${K}.choose`)}
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button
          type="button"
          className="h-11 w-full gap-2 font-semibold"
          disabled={!file || upload.isPending}
          onClick={send}
        >
          {upload.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t(`${K}.uploading`)}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {t(`${K}.upload`)}
            </>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={upload.isPending}
            onClick={onCancel}
          >
            {t(`${K}.keepSigned`)}
          </Button>
        )}
      </div>

      <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
        <p>{t(`${K}.blanksNote`)}</p>
        <p>{t(`${K}.version`, { version })}</p>
      </div>
    </section>
  );
}
