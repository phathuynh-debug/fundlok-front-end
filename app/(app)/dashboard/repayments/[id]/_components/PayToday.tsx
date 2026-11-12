"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  FileUp,
  Loader2,
  Upload,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInvestmentDue, usePayWithReceipt } from "@/hooks/use-repayment";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { RECEIPT_MAX_BYTES, RECEIPT_TYPES } from "@/services/funding.service";
import type {
  InvestmentDue,
  RepaymentPayee,
} from "@/services/repayment.service";
import { CopyRow } from "../../../invest/_components/TransferDetails";

const K = "dashboard.sme.investment.pay";

// Failures the business can act on, by X-Error-Code.
const KNOWN_ERRORS = new Set([
  "FILE_TOO_LARGE",
  "UNSUPPORTED_TYPE",
  "DUPLICATE_FILE",
  "NOT_DUE_YET",
]);

function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Today's repayment to this investor: every day due today or earlier that is
// not marked paid yet, as one transfer. "Repay" shows where it goes (the
// investor's own account, the exact amount and the memo, each copyable, and a
// VietQR carrying all of it), then the business uploads its bank's receipt,
// which marks those days paid. The investor then has two working days to
// report a payment that did not arrive.
export function PayToday({ trancheId }: { trancheId: string }) {
  const { t, locale } = useTranslations();
  const due = useInvestmentDue(trancheId);
  const [open, setOpen] = useState(false);
  const money = (vnd: number) => formatCurrency(vnd, locale);

  if (due.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const data = due.data;
  const nothingDue = !data || data.days.length === 0 || data.net_vnd === 0;
  const dates = [...new Set(data?.days.map((day) => day.due_date) ?? [])];

  return (
    <section
      aria-labelledby="pay-today"
      className="space-y-4 rounded-xl border border-primary/30 bg-card p-4 md:p-5"
      data-testid="pay-today"
    >
      <h2
        id="pay-today"
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        {t(`${K}.heading`)}
      </h2>

      {nothingDue || !data ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {t(`${K}.none`)}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {t(`${K}.amount`)}
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {money(data.net_vnd)}
              </p>
              {data.tax_withheld_vnd > 0 && (
                <p className="text-xs tabular-nums text-muted-foreground">
                  {t("dashboard.sme.repayments.inclTax", {
                    gross: money(data.gross_vnd),
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t(`${K}.includes`, {
                  count: dates.length,
                  dates: dates
                    .map((date) => formatDate(date, locale))
                    .join(", "),
                })}
                {data.days.some((day) => day.kind === "STUB") &&
                  ` · ${t(`${K}.withStub`)}`}
              </p>
            </div>
            {!open && (
              <Button
                type="button"
                className="gap-2"
                onClick={() => setOpen(true)}
                disabled={!data.payee}
              >
                <Wallet className="h-4 w-4" />
                {t(`${K}.repay`)}
              </Button>
            )}
          </div>

          {data.rejection && (
            <div
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground"
              role="alert"
              data-testid="pay-rejected"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              <span>
                {t(`${K}.rejected`, { reason: data.rejection.reason })}
              </span>
            </div>
          )}
          {dates.length > 1 && (
            <p
              className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
              role="status"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t(`${K}.overdue`, { count: dates.length - 1 })}
            </p>
          )}
          {!data.payee && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {t(`${K}.noPayee`)}
            </p>
          )}

          {open && data.payee && (
            <PayPanel
              due={data}
              payee={data.payee}
              trancheId={trancheId}
              onCancel={() => setOpen(false)}
              onPaid={() => setOpen(false)}
            />
          )}
        </>
      )}
    </section>
  );
}

function PayPanel({
  due,
  payee,
  trancheId,
  onCancel,
  onPaid,
}: {
  due: InvestmentDue;
  payee: RepaymentPayee;
  trancheId: string;
  onCancel: () => void;
  onPaid: () => void;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const pay = usePayWithReceipt(trancheId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  // One key per chosen file: a retry of the same file replays, a new file is a
  // new receipt.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const amount = formatCurrency(due.net_vnd, locale);

  const choose = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!(RECEIPT_TYPES as readonly string[]).includes(picked.type)) {
      setError(t(`${K}.errors.UNSUPPORTED_TYPE`));
      return;
    }
    if (picked.size > RECEIPT_MAX_BYTES) {
      setError(t(`${K}.errors.FILE_TOO_LARGE`));
      return;
    }
    setFile(picked);
    setIdempotencyKey(crypto.randomUUID());
  };

  const send = () => {
    if (!file) return;
    setError(null);
    pay.mutate(
      {
        repaymentDayIds: due.days.map((day) => day.repayment_day_id),
        file,
        idempotencyKey,
      },
      {
        onSuccess: () => {
          toast({ title: t(`${K}.paidToast`) });
          onPaid();
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
    <div className="space-y-5 border-t pt-4" data-testid="pay-panel">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t(`${K}.transferTitle`)}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.transferHint`)}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
        {due.vietqr_payload && (
          <div className="mx-auto space-y-2 text-center">
            {/* A QR needs a light background to stay scannable in dark mode. */}
            <div
              className="rounded-2xl border border-border/40 bg-white p-4 shadow-sm"
              data-testid="pay-qr"
              data-qr-value={due.vietqr_payload}
            >
              <QRCode value={due.vietqr_payload} size={176} />
            </div>
            <p className="max-w-56 text-xs text-muted-foreground">
              {t("dashboard.sme.repayments.qrHint")}
            </p>
          </div>
        )}
        <div className="divide-y rounded-xl border px-4" data-testid="payee">
          <CopyRow label={t(`${K}.bank`)} value={payee.bank_name} t={t} />
          <CopyRow
            label={t(`${K}.accountNumber`)}
            value={payee.account_number}
            mono
            t={t}
          />
          <CopyRow
            label={t(`${K}.accountName`)}
            value={payee.account_name}
            t={t}
          />
          <CopyRow
            label={t(`${K}.amountLabel`)}
            value={String(due.net_vnd)}
            display={amount}
            t={t}
          />
          <CopyRow
            label={t("dashboard.sme.repayments.memo")}
            value={due.reference_code}
            mono
            t={t}
          />
        </div>
      </div>

      <div
        className="space-y-3 rounded-xl border bg-muted/20 p-4"
        data-testid="pay-receipt"
      >
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileUp className="h-4 w-4 text-muted-foreground" />
            {t(`${K}.receiptTitle`)}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(`${K}.receiptBody`)}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={RECEIPT_TYPES.join(",")}
          className="sr-only"
          aria-label={t(`${K}.choose`)}
          data-testid="pay-receipt-input"
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {file && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 text-sm">
            <span className="min-w-0 truncate font-medium text-foreground">
              {file.name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {sizeLabel(file.size)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={pay.isPending}
              className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t(`${K}.remove`)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={pay.isPending}
          >
            <Upload className="h-4 w-4" />
            {t(`${K}.choose`)}
          </Button>
          <Button
            type="button"
            size="sm"
            // The label carries the amount and is long in Vietnamese: on a
            // narrow phone it wraps onto two lines and the button grows,
            // instead of running past the card.
            className="h-auto min-h-8 max-w-full whitespace-normal py-1.5 text-center leading-snug"
            onClick={send}
            disabled={!file || pay.isPending}
          >
            {pay.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(`${K}.sending`)}
              </>
            ) : (
              t(`${K}.send`, { amount })
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={pay.isPending}
          >
            {t(`${K}.cancel`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
