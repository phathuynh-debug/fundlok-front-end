"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-authentication";
import {
  useAdminInvestorTransfer,
  useDecideReceipt,
} from "@/hooks/use-admin-funding";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date";
import type {
  AdminInvestorTransfer,
  AdminReceiptFields,
} from "@/services/admin-funding.service";
import { ReceiptViewer } from "./ReceiptViewer";
import { TransferHistory } from "./TransferHistory";
import { TransferStatusBadge } from "./TransferQueue";
import { transferErrorMessage } from "./transfer-errors";

// The review panel for one investor ticket.
//
// Built around the question staff answer: did this money reach the business,
// as FundLok's QR asked? So it shows what the receipt should show next to the
// receipt itself, and staff approve or deny after looking: nothing is typed in
// or compared. A receipt approved records the investment as paid; one denied
// is rejected, and the investor can upload the right one. Approved means
// received: the business has nothing to confirm. A ticket under
// review (a late receipt, or the business disputing) is settled the same way.
// Staff never decide money they sent themselves.
export function TransferReviewSheet({
  trancheId,
  onOpenChange,
}: {
  trancheId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useTranslations();
  const { data, isLoading, isError } = useAdminInvestorTransfer(trancheId);
  const { data: me } = useCurrentUser();
  const money = (vnd: number) => formatCurrency(vnd, locale);
  const own = Boolean(data && me && data.investor_id === me.id);

  return (
    <Sheet open={trancheId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {data?.investor_full_name ||
              data?.investor_email ||
              t("admin.transactions.sheet.title")}
          </SheetTitle>
          <SheetDescription>
            {data?.project_name ?? t("admin.transactions.sheet.subtitle")}
          </SheetDescription>
        </SheetHeader>

        {isError ? (
          <p role="alert" className="px-4 py-6 text-sm text-destructive">
            {t("admin.transactions.sheet.loadFailed")}
          </p>
        ) : isLoading || !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 px-4 pb-8">
            {/* --- The ticket --- */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {t("admin.transactions.sheet.ticketHeading")}
                </h3>
                <TransferStatusBadge transfer={data} />
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                <Row label={t("admin.transactions.table.amount")}>
                  <span className="font-semibold tabular-nums">
                    {money(data.amount_vnd)}
                  </span>
                </Row>
                <Row label={t("admin.transactions.table.memo")}>
                  <span className="font-mono">{data.reference_code}</span>
                </Row>
                <Row label={t("admin.transactions.table.investor")}>
                  {data.investor_email}
                </Row>
                <Row label={t("admin.transactions.table.reserved")}>
                  {formatDateTime(data.reserved_at, locale)}
                </Row>
                <Row label={t("admin.transactions.sheet.deadline")}>
                  {formatDateTime(data.hold_expires_at, locale)}
                </Row>
                <Row label={t("admin.transactions.table.receipt")}>
                  {data.receipt_submitted_at
                    ? formatDateTime(data.receipt_submitted_at, locale)
                    : "—"}
                </Row>
              </dl>
            </section>

            {/* --- What a matching receipt shows --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.transactions.sheet.expectedHeading")}
              </h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl border bg-muted/30 p-3 text-xs">
                <Row label={t("admin.transactions.fields.amount_vnd")}>
                  <span className="tabular-nums">{money(data.amount_vnd)}</span>
                </Row>
                <Row label={t("admin.transactions.fields.memo")}>
                  {t("admin.transactions.sheet.memoContains").replace(
                    "{memo}",
                    data.reference_code,
                  )}
                </Row>
                <Row label={t("admin.transactions.fields.payee_account")}>
                  <span className="font-mono">
                    {data.expected.payee_account_number ?? "—"}
                  </span>
                  {data.expected.payee_bank_name && (
                    <span className="text-muted-foreground">
                      {" · "}
                      {data.expected.payee_bank_name}
                    </span>
                  )}
                  {data.expected.payee_account_name && (
                    <span className="block text-muted-foreground">
                      {data.expected.payee_account_name}
                    </span>
                  )}
                </Row>
                <Row label={t("admin.transactions.fields.payer_name")}>
                  {data.expected.payer_kyc_name}
                </Row>
                <Row label={t("admin.transactions.fields.transferred_at")}>
                  {t("admin.transactions.sheet.afterReserved")}
                </Row>
              </dl>
            </section>

            {/* --- The receipt --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.transactions.sheet.receiptHeading")}
              </h3>
              {data.transfer?.has_file ? (
                <ReceiptViewer
                  key={data.transfer.id}
                  transferId={data.transfer.id}
                  filename={data.transfer.original_filename}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("admin.transactions.sheet.noReceipt")}
                </p>
              )}
              {data.transfer?.parsed_fields && <CheckResult transfer={data} />}
            </section>

            <Separator />

            <Actions transfer={data} own={own} />

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.transactions.sheet.historyHeading")}
              </h3>
              <TransferHistory trancheId={data.id} />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// What staff entered and how it compared. A field the checks flagged is
// marked, so the reviewer sees at a glance what did not match.
function CheckResult({ transfer }: { transfer: AdminInvestorTransfer }) {
  const { t, locale } = useTranslations();
  const fields = transfer.transfer!.parsed_fields as AdminReceiptFields;
  const failures = transfer.transfer!.failure_codes;
  const matched = transfer.transfer!.check_status === "MATCHED";
  const flagged = (name: keyof AdminReceiptFields) =>
    failures.some(
      (code) =>
        code === `MISSING_FIELD:${name}` || FAILURE_FIELD[code] === name,
    );
  const shown: [keyof AdminReceiptFields, string | null][] = [
    [
      "amount_vnd",
      fields.amount_vnd != null
        ? formatCurrency(fields.amount_vnd, locale)
        : null,
    ],
    [
      "transferred_at",
      fields.transferred_at
        ? formatDateTime(fields.transferred_at, locale)
        : null,
    ],
    ["payer_name", fields.payer_name],
    ["payer_account", fields.payer_account],
    ["payee_account", fields.payee_account],
    ["memo", fields.memo],
    ["bank_txn_id", fields.bank_txn_id],
  ];

  return (
    <div className="space-y-2">
      <div
        className={
          matched
            ? "flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-foreground"
            : "flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground"
        }
      >
        {matched ? (
          <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <div className="space-y-1">
          <p className="font-semibold">
            {matched
              ? t("admin.transactions.sheet.matched")
              : t("admin.transactions.sheet.mismatch")}
          </p>
          {!matched && (
            <ul className="list-disc space-y-0.5 pl-4">
              {failures.map((code) => (
                <li key={code}>{failureLabel(t, code)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        {shown.map(([name, value]) => (
          <Row key={name} label={t(`admin.transactions.fields.${name}`)}>
            <span
              className={
                flagged(name)
                  ? "font-medium text-amber-700 dark:text-amber-300"
                  : undefined
              }
            >
              {value || "—"}
            </span>
          </Row>
        ))}
      </dl>
    </div>
  );
}

const FAILURE_FIELD: Record<string, keyof AdminReceiptFields> = {
  AMOUNT_MISMATCH: "amount_vnd",
  REFERENCE_MISSING: "memo",
  PAYEE_MISMATCH: "payee_account",
  PAYER_NAME_MISMATCH: "payer_name",
  TIME_OUT_OF_RANGE: "transferred_at",
};

function failureLabel(t: (key: string) => string, code: string): string {
  if (code.startsWith("MISSING_FIELD:")) {
    return t("admin.transactions.failures.MISSING_FIELD").replace(
      "{field}",
      t(`admin.transactions.fields.${code.slice("MISSING_FIELD:".length)}`),
    );
  }
  const key = `admin.transactions.failures.${code}`;
  const label = t(key);
  return label === key ? code : label;
}

// What staff can do now: approve or deny, after looking at the receipt.
function Actions({
  transfer,
  own,
}: {
  transfer: AdminInvestorTransfer;
  own: boolean;
}) {
  const { t } = useTranslations();
  const receipt = transfer.transfer;
  const review =
    transfer.dispute && transfer.dispute.status !== "DECIDED"
      ? transfer.dispute
      : null;
  // A ticket left ATTESTED waits on staff too: approval means received.
  const toDecide =
    receipt !== null &&
    (review !== null ||
      transfer.status === "ATTESTED" ||
      (receipt.check_status === "AWAITING_FIELDS" && receipt.has_file));

  if (!toDecide) {
    return (
      <section className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-px h-4 w-4 shrink-0" aria-hidden />
        <p>{settledText(t, transfer)}</p>
      </section>
    );
  }
  if (own) {
    return (
      <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground">
        {t("admin.transactions.sheet.ownTransfer")}
      </p>
    );
  }
  return (
    <DecisionForm
      key={`${receipt!.id}:${review?.id ?? ""}`}
      transferId={receipt!.id}
      body={
        review
          ? causeText(t, review.cause)
          : t("admin.transactions.sheet.decideReceiptBody")
      }
      hint={
        review
          ? t("admin.transactions.sheet.reviewHint")
          : t("admin.transactions.sheet.receiptHint")
      }
    />
  );
}

/** Where a ticket with nothing to decide stands. */
function settledText(
  t: (key: string) => string,
  transfer: AdminInvestorTransfer,
): string {
  if (transfer.dispute?.outcome) {
    return t(`admin.transactions.sheet.decided.${transfer.dispute.outcome}`);
  }
  if (transfer.transfer?.check_status === "REJECTED") {
    return t("admin.transactions.sheet.receiptDenied");
  }
  return transfer.transfer
    ? t("admin.transactions.sheet.nothingToDo")
    : t("admin.transactions.sheet.waitingForReceipt");
}

// Approve or deny, with an optional note for the record. Nothing from the
// receipt is typed in: staff look at it and decide.
function DecisionForm({
  transferId,
  body,
  hint,
}: {
  transferId: string;
  body: string;
  hint: string;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const decide = useDecideReceipt();
  const [reason, setReason] = useState("");

  const send = (outcome: "APPROVED" | "DENIED") => {
    decide.mutate(
      { transferId, body: { outcome, reason: reason.trim() || null } },
      {
        onSuccess: () =>
          toast({ title: t(`admin.transactions.sheet.toast.${outcome}`) }),
        onError: (error) =>
          toast({
            variant: "destructive",
            title: t("admin.transactions.sheet.decideFailed"),
            description: transferErrorMessage(error, t, locale),
          }),
      },
    );
  };

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">
          {t("admin.transactions.sheet.decideHeading")}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <Textarea
        rows={2}
        value={reason}
        disabled={decide.isPending}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t("admin.transactions.sheet.notePlaceholder")}
        aria-label={t("admin.transactions.sheet.notePlaceholder")}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1 gap-2"
          disabled={decide.isPending}
          onClick={() => send("APPROVED")}
        >
          {decide.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {t("admin.transactions.sheet.approve")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 gap-2"
          disabled={decide.isPending}
          onClick={() => send("DENIED")}
        >
          <XCircle className="h-3.5 w-3.5" />
          {t("admin.transactions.sheet.deny")}
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {hint}
      </p>
    </section>
  );
}

// Why this ticket is under review, and what deciding it means; a cause the
// dictionary does not know yet gets the general question.
function causeText(t: (key: string) => string, cause: string): string {
  const key = `admin.transactions.causes.${cause}`;
  const text = t(key);
  return text === key ? t("admin.transactions.sheet.decideBody") : text;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </>
  );
}
