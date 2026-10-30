"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { AlertCircle, Check, Clock, Copy, Loader2 } from "lucide-react";
import { usePaymentInstructions } from "@/hooks/use-funding";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

const K = "investConfirm.transfer";

interface TransferDetailsProps {
  trancheId: string;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function CopyRow({
  label,
  value,
  display,
  mono = false,
  t,
}: {
  label: string;
  value: string;
  display?: string;
  mono?: boolean;
  t: TransferDetailsProps["t"];
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "break-all text-sm font-semibold text-foreground",
            mono && "font-mono",
          )}
        >
          {display ?? value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-muted"
        aria-label={t(`${K}.copyLabel`, { field: label })}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            {t(`${K}.copied`)}
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            {t(`${K}.copy`)}
          </>
        )}
      </button>
    </div>
  );
}

/** "1:05:09" style: what is left of the hold. */
function remaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

/**
 * Where the investor sends the money: the business's own account, the exact
 * amount and the payment memo, each copyable, and a VietQR (from the backend's
 * payload) that carries all of them into the investor's bank app. The money
 * goes from the investor's bank straight to the business (ADR-009).
 */
export function TransferDetails({
  trancheId,
  locale,
  t,
}: TransferDetailsProps) {
  const payment = usePaymentInstructions(trancheId);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (payment.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!payment.data) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t(`${K}.loadFailed`)}
      </p>
    );
  }

  const details = payment.data;
  const left = new Date(details.hold_expires_at).getTime() - now;
  const expired = left <= 0;
  const amount = formatCurrency(details.amount_vnd, locale);

  return (
    <section
      className="space-y-5"
      aria-labelledby="transfer-title"
      data-testid="transfer-details"
    >
      <div className="space-y-1">
        <h2 id="transfer-title" className="text-lg font-bold text-foreground">
          {t(`${K}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(`${K}.subtitle`, { name: details.account_name })}
        </p>
      </div>

      {expired ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {t(`${K}.expiredTitle`)}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(`${K}.expiredBody`)}
            </p>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm"
          data-testid="transfer-deadline"
        >
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-foreground">
            {t(`${K}.deadline`, {
              time: formatDateTime(details.hold_expires_at, locale),
            })}
          </span>
          <span className="ml-auto font-mono font-semibold tabular-nums text-foreground">
            {t(`${K}.timeLeft`, { time: remaining(left) })}
          </span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
        <div className="mx-auto space-y-2 text-center">
          {/* A QR needs a light background to stay scannable in dark mode. */}
          <div
            className={cn(
              "rounded-2xl border border-border/40 bg-white p-4 shadow-sm",
              expired && "opacity-40",
            )}
            data-testid="transfer-qr"
            data-qr-value={details.vietqr_payload}
          >
            <QRCode value={details.vietqr_payload} size={184} />
          </div>
          <p className="max-w-56 text-xs text-muted-foreground">
            {t(`${K}.qrHint`)}
          </p>
        </div>

        <div className="divide-y rounded-xl border px-4">
          <div className="py-2.5">
            <p className="text-xs text-muted-foreground">{t(`${K}.bank`)}</p>
            <p className="text-sm font-semibold text-foreground">
              {details.bank_name}
            </p>
          </div>
          <CopyRow
            label={t(`${K}.accountNumber`)}
            value={details.account_number}
            mono
            t={t}
          />
          <CopyRow
            label={t(`${K}.accountName`)}
            value={details.account_name}
            t={t}
          />
          <CopyRow
            label={t(`${K}.amount`)}
            value={String(details.amount_vnd)}
            display={amount}
            t={t}
          />
          <CopyRow
            label={t(`${K}.memo`)}
            value={details.reference_code}
            mono
            t={t}
          />
        </div>
      </div>

      <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
        <li>{t(`${K}.rules.ownAccount`)}</li>
        <li>{t(`${K}.rules.exact`)}</li>
        <li>{t(`${K}.rules.direct`, { name: details.account_name })}</li>
        <li>{t(`${K}.rules.receipt`)}</li>
      </ul>
    </section>
  );
}
