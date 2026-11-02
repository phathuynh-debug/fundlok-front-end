"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { CalendarCheck, Loader2, QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMarkDaysPaid, useTodaysPayments } from "@/hooks/use-repayment";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RepaymentRow } from "@/services/repayment.service";
import { Breakdown } from "./Breakdown";

const K = "dashboard.sme.repayments";

// What the business owes each investor today, and any earlier day not yet
// settled: one ticket per investor and day, each paid as its own transfer to
// that investor's account with the investor's memo (a VietQR carries all of it
// into the bank app). The business then marks the tickets it paid; each
// investor has two working days to report one that did not arrive.
export function TodaysRepayments() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const today = useTodaysPayments();
  const markPaid = useMarkDaysPaid();
  const [selected, setSelected] = useState<string[]>([]);
  // One key per selection sent: a double click marks nothing twice.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const money = (vnd: number) => formatCurrency(vnd, locale);

  if (today.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const data = today.data;
  const payable = (data?.rows ?? []).filter((row) => row.status === "DUE");

  const send = () =>
    markPaid.mutate(
      { repaymentDayIds: selected, idempotencyKey },
      {
        onSuccess: () => {
          toast({ title: t(`${K}.markedToast`) });
          setSelected([]);
          setIdempotencyKey(crypto.randomUUID());
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: t(`${K}.markFailed`),
            description: apiErrorMessage(error, locale, t("common.tryAgain")),
          }),
      },
    );

  return (
    <section
      aria-labelledby="todays-repayments"
      className="space-y-4 rounded-xl border border-border/60 bg-card p-4 md:p-5"
      data-testid="todays-repayments"
    >
      <div className="space-y-1">
        <h3
          id="todays-repayments"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          {t(`${K}.heading`)}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.hint`)}
        </p>
      </div>

      {!data || data.rows.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {t(`${K}.none`)}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-lg border">
            {data.rows.map((row) => (
              <RepaymentTicket
                key={row.repayment_day_id}
                row={row}
                checked={selected.includes(row.repayment_day_id)}
                onCheckedChange={(checked) =>
                  setSelected((prev) =>
                    checked
                      ? [...prev, row.repayment_day_id]
                      : prev.filter((id) => id !== row.repayment_day_id),
                  )
                }
              />
            ))}
          </ul>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {data.totals.tax_withheld_vnd > 0 && (
                <p className="text-foreground">
                  {t(`${K}.grossTotal`, {
                    gross: money(data.totals.gross_vnd),
                  })}
                </p>
              )}
              <p className="text-sm text-foreground">
                {t(`${K}.total`, { net: money(data.totals.net_vnd) })}
              </p>
              {data.totals.tax_withheld_vnd > 0 && (
                <p>
                  {t(`${K}.withheld`, {
                    tax: money(data.totals.tax_withheld_vnd),
                  })}
                </p>
              )}
            </div>
            {payable.length > 0 && (
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={selected.length === 0 || markPaid.isPending}
                onClick={send}
              >
                {markPaid.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t(`${K}.markPaid`, { count: selected.length })}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function RepaymentTicket({
  row,
  checked,
  onCheckedChange,
}: {
  row: RepaymentRow;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { t, locale } = useTranslations();
  const [showQr, setShowQr] = useState(false);
  const due = row.status === "DUE";

  return (
    <li
      className="space-y-2 px-3 py-2.5 text-sm"
      data-testid="repayment-ticket"
    >
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={checked}
          disabled={!due}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-label={t(`${K}.select`, { name: row.investor_display })}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">
              {row.investor_display}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {t(`${K}.kind.${row.kind}`)} ·{" "}
                {formatDate(row.due_date, locale)}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-right">
                {/* What to transfer (the QR's amount); tax included beneath. */}
                <span className="block font-semibold tabular-nums text-foreground">
                  {formatCurrency(row.net_vnd, locale)}
                </span>
                {row.tax_withheld_vnd > 0 && (
                  <span className="block text-[11px] tabular-nums text-muted-foreground">
                    {t(`${K}.inclTax`, {
                      gross: formatCurrency(row.gross_vnd, locale),
                    })}
                  </span>
                )}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  row.status === "REPORTED_MISSED" &&
                    "border-destructive/40 bg-destructive/10 text-destructive",
                  (row.status === "PRESUMED_PAID" ||
                    row.status === "MATCHED") &&
                    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                )}
              >
                {t(`${K}.status.${row.status}`)}
              </Badge>
            </div>
          </div>
          {row.payee && (
            <p className="text-xs text-muted-foreground">
              {row.payee.bank_name} ·{" "}
              <span className="font-mono">{row.payee.account_number}</span> ·{" "}
              {row.payee.account_name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t(`${K}.memo`)}{" "}
            <span className="font-mono text-foreground">
              {row.reference_code}
            </span>
          </p>
          <Breakdown row={row} />
        </div>
        {row.vietqr_payload && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0 gap-1.5"
            onClick={() => setShowQr((value) => !value)}
            aria-expanded={showQr}
          >
            <QrCode className="h-4 w-4" />
            {showQr ? t(`${K}.hideQr`) : t(`${K}.showQr`)}
          </Button>
        )}
      </div>
      {showQr && row.vietqr_payload && (
        <div className="flex flex-col items-center gap-1.5 pb-1">
          {/* A QR needs a light background to stay scannable in dark mode. */}
          <div className="rounded-xl border border-border/40 bg-white p-3">
            <QRCode value={row.vietqr_payload} size={148} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t(`${K}.qrHint`)}
          </p>
        </div>
      )}
    </li>
  );
}
