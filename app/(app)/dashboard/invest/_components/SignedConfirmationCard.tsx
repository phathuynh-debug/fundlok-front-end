"use client";

import { useState } from "react";
import { Download, Eye, FileCheck2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useTrancheConfirmation,
  useTrancheConfirmationPdf,
} from "@/hooks/use-funding";
import { useObjectUrl } from "@/hooks/use-object-url";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { contractNumber } from "@/lib/legal/investor-agreement";

const K = "investConfirm.signedConfirmation";

interface SignedConfirmationCardProps {
  trancheId: string;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The Investment Confirmation (Annex) the investor confirmed when they agreed
 * to this ticket, filled in and kept by the backend before the payment details
 * existed: shown above the transfer details, with the PDF to view or save.
 * Tickets from before confirmations were kept have none, and show nothing.
 */
export function SignedConfirmationCard({
  trancheId,
  locale,
  t,
}: SignedConfirmationCardProps) {
  const [open, setOpen] = useState(false);
  const confirmation = useTrancheConfirmation(trancheId);
  // Small (one page), and both buttons need it: fetched with the card.
  const pdf = useTrancheConfirmationPdf(trancheId, confirmation.isSuccess);
  const url = useObjectUrl(pdf.data?.blob ?? null);

  if (!confirmation.data) return null;
  const c = confirmation.data;
  const filename =
    pdf.data?.filename ?? `FundLok-xac-nhan-dau-tu-${c.reference_code}.pdf`;

  return (
    <section
      className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
      aria-labelledby="signed-confirmation-title"
      data-testid="signed-confirmation"
    >
      <div className="flex items-start gap-3">
        <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1 text-sm">
          <h3
            id="signed-confirmation-title"
            className="font-semibold text-foreground"
          >
            {t(`${K}.title`)}
          </h3>
          <p className="text-foreground">
            {t(`${K}.summary`, {
              listing: c.listing_ref,
              sme: c.sme_name,
              amount: contractNumber(c.amount_vnd),
            })}
          </p>
          <p className="text-muted-foreground">
            {t(`${K}.terms`, {
              rate: contractNumber(c.annual_rate_pct),
              months: c.term_months,
              fee: contractNumber(c.service_fee_vnd),
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(`${K}.dates`, {
              date: formatDate(
                `${c.expected_disbursement_date}T00:00:00`,
                locale,
              ),
              at: formatDateTime(c.confirmed_at, locale),
            })}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-8">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          disabled={!url}
          onClick={() => setOpen(true)}
        >
          {url ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          {t(`${K}.view`)}
        </Button>
        <Button
          asChild={!!url}
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          disabled={!url}
        >
          {url ? (
            <a href={url} download={filename}>
              <Download className="h-3.5 w-3.5" />
              {t(`${K}.download`)}
            </a>
          ) : (
            <span>
              <Download className="h-3.5 w-3.5" />
              {t(`${K}.download`)}
            </span>
          )}
        </Button>
      </div>
      {pdf.isError && (
        <p role="alert" className="pl-8 text-xs text-destructive">
          {t(`${K}.loadFailed`)}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t(`${K}.title`)}</DialogTitle>
            <DialogDescription>
              {t(`${K}.dialogDescription`, {
                ref: c.reference_code,
                version: c.agreement_version,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[65vh] overflow-hidden rounded-lg border bg-muted/30">
            {url && (
              <iframe
                src={`${url}#view=FitH`}
                title={t(`${K}.title`)}
                className="h-full w-full bg-background"
                data-testid="signed-confirmation-preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
