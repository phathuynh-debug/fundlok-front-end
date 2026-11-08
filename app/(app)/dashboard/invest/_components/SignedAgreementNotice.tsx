"use client";

import { useState } from "react";
import { AlertCircle, Download, FileCheck2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSignedInvestorAgreement } from "@/hooks/use-funding";
import { useObjectUrl } from "@/hooks/use-object-url";
import { formatDate } from "@/lib/format-date";

const K = "investConfirm.signedAgreement";

interface SignedAgreementNoticeProps {
  signedAt: string;
  version: string;
  fileName: string | null;
  /** Set while the signed copy may still be swapped for another file. */
  onReplace?: () => void;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The investor has signed the Investor Service Agreement: it applies to this
 * commitment, which signs only its Investment Confirmation. The signed copy
 * they uploaded opens from here, exactly as uploaded; until a commitment is
 * made under it, it can be replaced.
 */
export function SignedAgreementNotice({
  signedAt,
  version,
  fileName,
  onReplace,
  locale,
  t,
}: SignedAgreementNoticeProps) {
  const [open, setOpen] = useState(false);
  const signed = useSignedInvestorAgreement(signedAt, open);
  const url = useObjectUrl(signed.data?.blob ?? null);
  const downloadName =
    signed.data?.filename ?? fileName ?? "FundLok-hop-dong-dich-vu-da-ky.pdf";
  const vars = {
    date: formatDate(signedAt, locale),
    version,
    file: fileName ?? "PDF",
  };

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm"
      data-testid="signed-agreement-notice"
    >
      <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{t(`${K}.title`)}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.body`, vars)}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs font-semibold"
              >
                {t(`${K}.view`)}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t(`${K}.dialogTitle`)}</DialogTitle>
                <DialogDescription>{t(`${K}.stamp`, vars)}</DialogDescription>
              </DialogHeader>
              <div className="flex h-[65vh] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                {signed.isError ? (
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    {t(`${K}.loadFailed`)}
                  </p>
                ) : url ? (
                  <iframe
                    src={`${url}#view=FitH`}
                    title={t(`${K}.dialogTitle`)}
                    className="h-full w-full bg-background"
                    data-testid="signed-agreement-preview"
                  />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
              {url && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-fit gap-1.5"
                >
                  <a href={url} download={downloadName}>
                    <Download className="h-3.5 w-3.5" />
                    {t(`${K}.download`)}
                  </a>
                </Button>
              )}
            </DialogContent>
          </Dialog>
          {onReplace && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs font-semibold text-muted-foreground"
              onClick={onReplace}
            >
              {t(`${K}.replace`)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
