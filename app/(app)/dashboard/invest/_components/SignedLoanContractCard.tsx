"use client";

import { useState } from "react";
import { AlertCircle, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWindowLoanContract } from "@/hooks/use-funding";
import { useObjectUrl } from "@/hooks/use-object-url";

const K = "investConfirm.loanContract";

interface SignedLoanContractCardProps {
  /** The funding window the investor is about to commit to. */
  windowId: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The Loan Contract (Contract 5) the business and its personal guarantor
 * signed for this listing: the contract the investor's commitment concludes,
 * so it is there to read before they agree. Fetched on mount, so a listing
 * with none (one published before listing documents were signed: 404) shows
 * nothing rather than a button that fails. Only an eligible investor is
 * served the file.
 */
export function SignedLoanContractCard({
  windowId,
  t,
}: SignedLoanContractCardProps) {
  const [open, setOpen] = useState(false);
  const contract = useWindowLoanContract(windowId);
  const url = useObjectUrl(contract.data?.blob ?? null);
  const filename =
    contract.data?.filename ?? "FundLok-hop-dong-cho-vay-da-ky.pdf";

  // No signed copy for this listing: nothing to show.
  if (contract.isError && contract.error?.status === 404) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4 text-sm"
      data-testid="signed-loan-contract"
    >
      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold text-foreground">{t(`${K}.title`)}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.body`)}
        </p>
        {contract.isError ? (
          <p className="flex items-center gap-2 text-xs text-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            {t(`${K}.loadFailed`)}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs font-semibold"
              onClick={() => void contract.refetch()}
            >
              {t(`${K}.retry`)}
            </Button>
          </p>
        ) : !url ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t(`${K}.loading`)}
          </p>
        ) : (
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
                  <DialogDescription>{t(`${K}.dialogNote`)}</DialogDescription>
                </DialogHeader>
                <div className="flex h-[65vh] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                  <iframe
                    src={`${url}#view=FitH`}
                    title={t(`${K}.dialogTitle`)}
                    className="h-full w-full bg-background"
                    data-testid="signed-loan-contract-preview"
                  />
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-fit gap-1.5"
                >
                  <a href={url} download={filename}>
                    <Download className="h-3.5 w-3.5" />
                    {t(`${K}.download`)}
                  </a>
                </Button>
              </DialogContent>
            </Dialog>
            <a
              href={url}
              download={filename}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t(`${K}.download`)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
