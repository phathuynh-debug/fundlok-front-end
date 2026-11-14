"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleHelp,
  XCircle,
} from "lucide-react";

import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date";
import type {
  AdminReceiptFields,
  AdminSystemCheck,
} from "@/services/admin-funding.service";
import { failureLabel, reasonLabel } from "./receipt-codes";

// What the system made of the receipt (docs/specs/direct_transfer/receipt-ocr.md):
// its verdict and why, the recipient on the receipt against the business's
// verified account, what it read and how sure it was of each line, and staff's
// review of it. The receipt itself is shown above, so staff can check the
// reading against the image.

// A line read below this is flagged as hard to read (the backend's default
// threshold; a deciding field below it never decides a receipt).
const LOW_CONFIDENCE = 80;

const TONE = {
  ACCEPTED: "border-emerald-500/30 bg-emerald-500/10",
  DENIED: "border-destructive/40 bg-destructive/10",
  NEEDS_REVIEW: "border-amber-500/40 bg-amber-500/10",
} as const;
const TONE_ICON = {
  ACCEPTED: "text-emerald-600 dark:text-emerald-400",
  DENIED: "text-destructive",
  NEEDS_REVIEW: "text-amber-600 dark:text-amber-400",
} as const;

export function SystemCheckPanel({ check }: { check: AdminSystemCheck }) {
  const { t, locale } = useTranslations();
  const Icon =
    check.verdict === "ACCEPTED"
      ? CheckCircle2
      : check.verdict === "DENIED"
        ? XCircle
        : AlertTriangle;
  const title =
    check.verdict === "NEEDS_REVIEW" && check.suggested
      ? t(`admin.transactions.system.suggested.${check.suggested}`)
      : t(`admin.transactions.system.verdict.${check.verdict}`);
  const confidence =
    check.confidence == null
      ? t("admin.transactions.system.exactText")
      : `${Math.round(check.confidence)}%`;

  return (
    <section data-testid="system-check" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Bot className="h-4 w-4 text-muted-foreground" aria-hidden />
          {t("admin.transactions.system.heading")}
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {t("admin.transactions.system.readBy")
            .replace("{confidence}", confidence)
            .replace("{time}", formatDateTime(check.decided_at, locale))}
        </span>
      </div>

      <div
        className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed text-foreground ${TONE[check.verdict]}`}
      >
        <Icon className={`mt-px h-4 w-4 shrink-0 ${TONE_ICON[check.verdict]}`} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">{title}</p>
          {check.verdict === "ACCEPTED" && check.awaiting_review && (
            <p>{t("admin.transactions.system.acceptedAwaiting")}</p>
          )}
          {check.failure_codes.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-4">
              {check.failure_codes.map((code) => (
                <li key={code}>{failureLabel(t, code)}</li>
              ))}
            </ul>
          )}
          {check.verdict === "NEEDS_REVIEW" && check.review_reasons.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-4">
              {check.review_reasons.map((code) => (
                <li key={code}>{reasonLabel(t, code)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {check.receiver && <Receiver check={check} />}
      {check.fields && <Reading check={check} />}
      {check.reviewed_at && <Review check={check} />}
    </section>
  );
}

type Match = "ok" | "bad" | "unknown";

const MATCH_ICON: Record<Match, typeof CheckCircle2> = {
  ok: CheckCircle2,
  bad: XCircle,
  unknown: CircleHelp,
};
const MATCH_CLASS: Record<Match, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  bad: "text-destructive",
  unknown: "text-amber-600 dark:text-amber-400",
};

// The recipient's bank, account number and holder: what the receipt shows
// against the business's verified account.
function Receiver({ check }: { check: AdminSystemCheck }) {
  const { t } = useTranslations();
  const r = check.receiver!;
  const digits = (value: string | null) => (value ?? "").replace(/[\s.-]/g, "");
  const failed = (code: string) => check.failure_codes.includes(code);
  const rows: { key: string; read: string | null; expected: string | null; match: Match }[] = [
    {
      key: "bank",
      read: r.bank_identified ?? r.bank_read,
      expected: r.expected_bank,
      match: failed("PAYEE_BANK_MISMATCH")
        ? "bad"
        : r.bank_identified_bin && r.bank_identified_bin === r.expected_bank_bin
          ? "ok"
          : "unknown",
    },
    {
      key: "account",
      read: r.account_read,
      expected: r.expected_account,
      match: !r.account_read
        ? "unknown"
        : digits(r.account_read) === digits(r.expected_account)
          ? "ok"
          : "bad",
    },
    {
      key: "holder",
      read: r.holder_read,
      expected: r.expected_holder,
      match: failed("PAYEE_NAME_MISMATCH")
        ? "bad"
        : r.holder_read && r.expected_holder
          ? "ok"
          : "unknown",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border text-xs">
      <div className="grid grid-cols-[minmax(0,5.5rem)_1fr_1fr] gap-x-3 border-b bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">
        <span>{t("admin.transactions.system.receiverHeading")}</span>
        <span>{t("admin.transactions.system.onReceipt")}</span>
        <span>{t("admin.transactions.system.verifiedAccount")}</span>
      </div>
      {rows.map((row) => {
        const MatchIcon = MATCH_ICON[row.match];
        return (
          <div
            key={row.key}
            data-testid={`receiver-${row.key}`}
            data-match={row.match}
            className="grid grid-cols-[minmax(0,5.5rem)_1fr_1fr] items-start gap-x-3 border-b px-3 py-1.5 last:border-b-0"
          >
            <span className="text-muted-foreground">
              {t(`admin.transactions.system.receiver.${row.key}`)}
            </span>
            <span className="flex min-w-0 items-start gap-1 break-words">
              <MatchIcon
                className={`mt-px h-3.5 w-3.5 shrink-0 ${MATCH_CLASS[row.match]}`}
                aria-label={t(`admin.transactions.system.match.${row.match}`)}
              />
              <span className={row.match === "bad" ? "font-medium text-destructive" : undefined}>
                {row.read || "—"}
              </span>
            </span>
            <span className="min-w-0 break-words">{row.expected || "—"}</span>
          </div>
        );
      })}
    </div>
  );
}

// Every field it read, with a line it found hard to read marked.
function Reading({ check }: { check: AdminSystemCheck }) {
  const { t, locale } = useTranslations();
  const fields = check.fields as AdminReceiptFields;
  const shown: [keyof AdminReceiptFields, string | null | undefined][] = [
    ["amount_vnd", fields.amount_vnd != null ? formatCurrency(fields.amount_vnd, locale) : null],
    ["transferred_at", fields.transferred_at ? formatDateTime(fields.transferred_at, locale) : null],
    ["payer_name", fields.payer_name],
    ["payer_account", fields.payer_account],
    ["payee_name", fields.payee_name],
    ["payee_account", fields.payee_account],
    ["payee_bank", fields.payee_bank],
    ["memo", fields.memo],
    ["bank_txn_id", fields.bank_txn_id],
  ];

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {t("admin.transactions.system.readHeading")}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        {shown.map(([name, value]) => {
          const conf = check.field_confidence[name];
          const low = value != null && conf != null && conf < LOW_CONFIDENCE;
          return (
            <div key={name} className="contents">
              <dt className="text-muted-foreground">
                {t(`admin.transactions.fields.${name}`)}
              </dt>
              <dd className="min-w-0 break-words text-foreground">
                <span className={low ? "font-medium text-amber-700 dark:text-amber-300" : undefined}>
                  {value || "—"}
                </span>
                {low && (
                  <span className="ml-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                    {t("admin.transactions.system.lowConfidence").replace(
                      "{n}",
                      String(Math.round(conf ?? 0)),
                    )}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

// Staff's review of the system's verdict: final, with who, when and why.
function Review({ check }: { check: AdminSystemCheck }) {
  const { t, locale } = useTranslations();
  const who =
    check.reviewed_by?.full_name || check.reviewed_by?.email || t("admin.transactions.activity.system");
  return (
    <div
      data-testid="system-review"
      className="space-y-1 rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-foreground"
    >
      <p>
        {t("admin.transactions.system.reviewed")
          .replace("{name}", who)
          .replace("{time}", formatDateTime(check.reviewed_at!, locale))
          .replace(
            "{outcome}",
            t(`admin.transactions.system.outcome.${check.review_outcome}`),
          )}
      </p>
      {check.overrides_system && (
        <p className="font-medium">{t("admin.transactions.system.overrides")}</p>
      )}
      {check.review_reason && (
        <p className="break-words text-muted-foreground">{check.review_reason}</p>
      )}
    </div>
  );
}
