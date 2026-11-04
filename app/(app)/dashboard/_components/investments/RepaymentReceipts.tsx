"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ReceiptText,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useConfirmRepaymentReceipt,
  useRepaymentReceipts,
} from "@/hooks/use-repayment";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  RepaymentReceipt,
  RepaymentReceiptAccount,
  RepaymentReceiptFilter,
} from "@/services/repayment.service";

const K = "dashboard.investor.investments.receipts";

// Each repayment a business says it paid this investor, with a "Received"
// button that confirms the money arrived in their bank account. Confirming
// settles the days on the receipt and closes any missing-payment report the
// investor had opened for those days as paid.
export function RepaymentReceipts() {
  const { t } = useTranslations();
  const [filter, setFilter] = useState<RepaymentReceiptFilter>("AWAITING");
  const receipts = useRepaymentReceipts(filter);
  const items = receipts.data ?? [];

  if (receipts.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section
      aria-labelledby="repayment-receipts"
      className="space-y-4 rounded-xl border border-border/60 bg-card p-4 md:p-5"
      data-testid="repayment-receipts"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3
            id="repayment-receipts"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <ReceiptText
              className="h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            {t(`${K}.heading`)}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(`${K}.hint`)}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() =>
            setFilter((current) =>
              current === "AWAITING" ? "ALL" : "AWAITING",
            )
          }
        >
          {filter === "AWAITING" ? t(`${K}.showAll`) : t(`${K}.showAwaiting`)}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {filter === "AWAITING" ? t(`${K}.emptyAwaiting`) : t(`${K}.emptyAll`)}
        </p>
      ) : (
        <ul className="space-y-3" data-testid="repayment-receipts-list">
          {items.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReceiptCard({ receipt }: { receipt: RepaymentReceipt }) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const confirm = useConfirmRepaymentReceipt();
  const [asking, setAsking] = useState(false);

  const money = (vnd: number) => formatCurrency(vnd, locale);
  const awaiting = receipt.status === "AWAITING_CONFIRMATION";
  const dates = [...new Set(receipt.days.map((day) => day.due_date))];
  const formattedDates = dates.map((d) => formatDate(d, locale)).join(", ");

  const confirmNow = () =>
    confirm.mutate(receipt.id, {
      onSuccess: () => {
        toast({ title: t(`${K}.confirmedToast`) });
        setAsking(false);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: t(`${K}.confirmFailed`),
          description:
            error.code === "NOTHING_TO_CONFIRM"
              ? t(`${K}.alreadyConfirmed`)
              : apiErrorMessage(error, locale, t("common.tryAgain")),
        });
        setAsking(false);
      },
    });

  return (
    <li
      className="space-y-3 rounded-xl border bg-background/60 p-4 text-sm"
      data-testid="repayment-receipt"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-semibold text-foreground">
            {receipt.project_name || "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.investor.investments.memo")}{" "}
            <span className="font-mono">{receipt.reference_code}</span>
            {" · "}
            {dates.length === 1
              ? formattedDates
              : t(`${K}.daysCount`, {
                  count: dates.length,
                  dates: formattedDates,
                })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(`${K}.uploadedAt`, {
              date: formatDateTime(receipt.submitted_at, locale),
            })}
            {receipt.confirmed_at &&
              ` · ${t(`${K}.confirmedAt`, {
                date: formatDateTime(receipt.confirmed_at, locale),
              })}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-right">
            <span className="block text-base font-bold tabular-nums text-foreground">
              {money(receipt.net_vnd)}
            </span>
            {receipt.tax_withheld_vnd > 0 && (
              <span className="block text-[11px] tabular-nums text-muted-foreground">
                {t("dashboard.investor.investments.inclTax", {
                  gross: money(receipt.gross_vnd),
                })}
              </span>
            )}
          </span>
          <Badge
            variant="outline"
            className={cn(
              awaiting &&
                "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
              receipt.status === "CONFIRMED" &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              receipt.status === "REJECTED" &&
                "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            {t(`${K}.status.${receipt.status}`)}
          </Badge>
        </div>
      </div>

      {(receipt.payee || receipt.payer) && (
        <dl className="grid gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs sm:grid-cols-2">
          {receipt.payee && (
            <div>
              <dt className="text-muted-foreground">{t(`${K}.toAccount`)}</dt>
              <dd className="text-foreground">
                <AccountLine account={receipt.payee} />
              </dd>
            </div>
          )}
          {receipt.payer && (
            <div>
              <dt className="text-muted-foreground">{t(`${K}.fromAccount`)}</dt>
              <dd className="text-foreground">
                <AccountLine account={receipt.payer} />
              </dd>
            </div>
          )}
        </dl>
      )}

      {receipt.open_report && awaiting && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
          <AlertTriangle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <span>{t(`${K}.openReport`)}</span>
        </p>
      )}

      {awaiting && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={confirm.isPending}
            onClick={() => setAsking(true)}
          >
            {confirm.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {t(`${K}.receivedBtn`)}
          </Button>
        </div>
      )}

      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`${K}.confirmTitle`)}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {t(`${K}.confirmBody`, {
                  amount: money(receipt.net_vnd),
                  project: receipt.project_name || "—",
                  memo: receipt.reference_code,
                })}
              </span>
              {receipt.open_report && (
                <span className="block font-medium text-foreground">
                  {t(`${K}.confirmClosesReport`)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirm.isPending}>
              {t("dashboard.investor.investments.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirm.isPending}
              onClick={confirmNow}
            >
              {t(`${K}.confirmAction`)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function AccountLine({ account }: { account: RepaymentReceiptAccount }) {
  return (
    <>
      <span className="font-mono">{account.account_number}</span>
      <span className="text-muted-foreground"> · {account.bank_name}</span>
      <span className="block text-muted-foreground">
        {account.account_name}
      </span>
    </>
  );
}
