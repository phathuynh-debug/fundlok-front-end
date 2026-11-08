"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Download,
  FileSignature,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceAgreement } from "@/hooks/use-loans";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import { UploadField } from "./UploadField";

const HOW_TO_SIGN = [
  "dashboard.sme.agreement.how1",
  "dashboard.sme.agreement.how2",
  "dashboard.sme.agreement.how3",
] as const;

/**
 * Step 4: the SME Service Agreement (Contract 2).
 *
 * The backend fills the agreement in from what FundLok already holds (the
 * verified business, the approved bank account, this application's amount
 * and term) and the SME sees it here before anything else: preview, download
 * the same file, sign it with the enterprise's digital signature, upload the
 * signed PDF. Send refuses without it, and the backend refuses a PDF with no
 * digital signature in it.
 */
export function ServiceAgreementStep() {
  const { loanApplicationId, isCheckingAgreement, t } =
    useLoanApplicationContext();
  const agreement = useServiceAgreement(loanApplicationId);
  const url = useObjectUrl(agreement.data?.blob ?? null);
  const filename =
    agreement.data?.filename ?? "FundLok-hop-dong-dich-vu.pdf";

  return (
    <div className="space-y-5 p-2 md:p-4">
      <div className="space-y-1.5">
        <h4 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <FileSignature className="h-5 w-5 shrink-0" aria-hidden />
          {t("dashboard.sme.agreement.title")}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("dashboard.sme.agreement.subtitle")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* The agreement as the SME will sign it. */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-muted/30">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <span className="truncate text-xs font-semibold text-muted-foreground">
              {t("dashboard.sme.agreement.previewLabel")}
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
                  {t("dashboard.sme.agreement.download")}
                </a>
              ) : (
                <span>
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  {t("dashboard.sme.agreement.download")}
                </span>
              )}
            </Button>
          </div>

          <div className="flex h-[420px] items-center justify-center sm:h-[560px]">
            {agreement.isError ? (
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <AlertCircle
                  className="h-6 w-6 text-destructive"
                  aria-hidden
                />
                <p className="text-sm text-foreground">
                  {t("dashboard.sme.agreement.loadFailed")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => void agreement.refetch()}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  {t("dashboard.sme.agreement.retry")}
                </Button>
              </div>
            ) : url ? (
              <iframe
                src={`${url}#view=FitH`}
                title={t("dashboard.sme.agreement.title")}
                className="h-full w-full bg-background"
              />
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("dashboard.sme.agreement.loading")}
              </p>
            )}
          </div>
        </div>

        {/* How to sign it, and where it comes back. */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
            <h5 className="text-sm font-bold text-foreground">
              {t("dashboard.sme.agreement.howTitle")}
            </h5>
            <ol className="space-y-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">
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

          <UploadField
            docKey="serviceAgreement"
            label={t("dashboard.sme.agreement.signedLabel")}
          />
          {isCheckingAgreement && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {t("dashboard.sme.agreement.checking")}
            </p>
          )}

          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>{t("dashboard.sme.agreement.blanksNote")}</p>
            <p>{t("dashboard.sme.agreement.rateNote")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * An object URL for a Blob, revoked when the Blob changes or the step closes.
 *
 * Created inside the effect, not in a useMemo: under Strict Mode React runs
 * an effect's cleanup and then the effect again, and a memoised URL would be
 * revoked by that cleanup while still on screen.
 */
function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    // Syncing with an external resource (the browser's blob store); there is
    // no render-time way to create and later revoke it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
      setUrl(null);
    };
  }, [blob]);
  return url;
}
