"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useMarkFeeInvoicePaid } from "@/hooks/use-admin-funding";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { ApiError } from "@/lib/types";
import type { AdminFeeInvoice } from "@/services/admin-funding.service";
import { FeeStatusBadge } from "./FeeStatusBadge";

// One service fee with the investment package it is charged on: the 3% is on
// the money these investments sent the business, plus VAT, paid separately into
// FundLok's own account. While unpaid, staff mark it paid once the transfer
// (with its memo) shows on FundLok's statement; that also lets the business
// open its next round. Marking is final and audited.

const BANK_TXN_FIELD = "fee-bank-txn";
export function FeeInvoiceSheet({
  invoice,
  onOpenChange,
  onUpdated,
  focusForm = false,
}: {
  invoice: AdminFeeInvoice | null;
  onOpenChange: (open: boolean) => void;
  /** The invoice as it stands after a change (marked paid). */
  onUpdated: (invoice: AdminFeeInvoice) => void;
  /** Opened from a row's "Mark as paid": start in the bank transaction field. */
  focusForm?: boolean;
}) {
  const { t, locale } = useTranslations();
  const money = (vnd: number) => formatCurrency(vnd, locale);

  return (
    <Sheet open={invoice !== null} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-xl"
        onOpenAutoFocus={(event) => {
          const field = focusForm
            ? document.getElementById(BANK_TXN_FIELD)
            : null;
          if (field) {
            event.preventDefault();
            field.focus();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {invoice?.project_name ?? t("admin.transactions.fees.sheetTitle")}
          </SheetTitle>
          <SheetDescription>
            {invoice
              ? `${t("admin.transactions.fees.sheetTitle")} · ${
                  invoice.sme_full_name || invoice.sme_email
                }`
              : null}
          </SheetDescription>
        </SheetHeader>

        {invoice && (
          <div className="space-y-6 px-4 pb-8">
            {/* --- The invoice --- */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {t("admin.transactions.fees.invoiceHeading")}
                </h3>
                <FeeStatusBadge fee={invoice} />
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                <Row label={t("admin.transactions.fees.base")}>
                  {money(invoice.base_vnd)}
                </Row>
                <Row label={t("admin.transactions.fees.feeLine")}>
                  {money(invoice.fee_vnd)}
                </Row>
                <Row label={t("admin.transactions.fees.vat")}>
                  {money(invoice.vat_vnd)}
                </Row>
                {invoice.late_fee_vnd > 0 && (
                  <Row label={t("admin.transactions.fees.lateFee")}>
                    {money(invoice.late_fee_vnd)}
                  </Row>
                )}
                <Row label={t("admin.transactions.fees.total")}>
                  <span className="font-semibold">
                    {money(invoice.total_vnd)}
                  </span>
                </Row>
                <Row label={t("admin.transactions.fees.memo")}>
                  <span className="font-mono">{invoice.reference_code}</span>
                </Row>
                <Row label={t("admin.transactions.fees.invoiceNumber")}>
                  <span className="font-mono">{invoice.invoice_number}</span>
                </Row>
                <Row label={t("admin.transactions.fees.issued")}>
                  {formatDateTime(invoice.issued_at, locale)}
                </Row>
                <Row label={t("admin.transactions.fees.due")}>
                  {formatDate(invoice.due_at, locale)}
                </Row>
                <Row label={t("admin.transactions.fees.email")}>
                  {invoice.email_status === "SENT" && invoice.emailed_at
                    ? `${t("admin.transactions.fees.emailSent")} · ${formatDateTime(
                        invoice.emailed_at,
                        locale,
                      )}`
                    : invoice.email_status === "FAILED"
                      ? t("admin.transactions.fees.emailFailed")
                      : invoice.email_status === "SENDING"
                        ? t("admin.transactions.fees.emailSending")
                        : t("admin.transactions.fees.emailNone")}
                </Row>
              </dl>
            </section>

            <Separator />

            {/* --- The investment package the fee is charged on --- */}
            <section className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {t("admin.transactions.fees.package")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("admin.transactions.fees.packageHelp")}
                </p>
              </div>
              {invoice.investments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("admin.transactions.fees.noInvestments")}
                </p>
              ) : (
                <ul className="divide-y rounded-md border text-xs">
                  {invoice.investments.map((investment) => (
                    <li
                      key={investment.tranche_id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {investment.investor_name ||
                            investment.investor_email}
                        </p>
                        <p className="truncate text-muted-foreground">
                          <span className="font-mono">
                            {investment.reference_code}
                          </span>
                          {investment.confirmed_at &&
                            ` · ${formatDate(investment.confirmed_at, locale)}`}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums font-medium">
                        {money(investment.amount_vnd)}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-3 bg-muted/40 px-3 py-2 font-semibold">
                    <span>{t("admin.transactions.fees.base")}</span>
                    <span className="tabular-nums">
                      {money(
                        invoice.investments.reduce(
                          (sum, item) => sum + item.amount_vnd,
                          0,
                        ),
                      )}
                    </span>
                  </li>
                </ul>
              )}
            </section>

            <Separator />

            {/* --- Payment --- */}
            {invoice.status === "PAID" ? (
              <section className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-foreground">
                <CheckCircle2
                  className="mt-px h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>
                  {t("admin.transactions.fees.paidNote")
                    .replace(
                      "{date}",
                      invoice.paid_at
                        ? formatDateTime(invoice.paid_at, locale)
                        : "—",
                    )
                    .replace("{txn}", invoice.paid_bank_txn_id ?? "—")}
                </span>
              </section>
            ) : invoice.status === "VOID" ? null : (
              // Keyed on the invoice so switching rows starts a clean form.
              <MarkPaidForm
                key={invoice.id}
                invoice={invoice}
                onPaid={onUpdated}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MarkPaidForm({
  invoice,
  onPaid,
}: {
  invoice: AdminFeeInvoice;
  onPaid: (invoice: AdminFeeInvoice) => void;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { mutateAsync: markPaid, isPending } = useMarkFeeInvoicePaid();
  const [bankTxnId, setBankTxnId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const txn = bankTxnId.trim();
    const note = reason.trim();
    if (!txn || !note) {
      setError(t("admin.transactions.fees.required"));
      return;
    }
    setError(null);
    try {
      const updated = await markPaid({
        invoiceId: invoice.id,
        payload: { bank_txn_id: txn, reason: note },
      });
      toast({ title: t("admin.transactions.fees.marked") });
      onPaid(updated);
    } catch (err) {
      const code = (err as ApiError | null)?.code;
      toast({
        variant: "destructive",
        title: t("admin.transactions.fees.markFailed"),
        description:
          code === "DUPLICATE_BANK_TXN"
            ? t("admin.transactions.fees.duplicateTxn")
            : apiErrorMessage(err, locale, t("common.tryAgain")),
      });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">
          {t("admin.transactions.fees.markHeading")}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("admin.transactions.fees.markHelp")
            .replace("{amount}", formatCurrency(invoice.total_vnd, locale))
            .replace("{memo}", invoice.reference_code)}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={BANK_TXN_FIELD}>
          {t("admin.transactions.fees.bankTxnLabel")}
        </Label>
        <Input
          id={BANK_TXN_FIELD}
          autoComplete="off"
          maxLength={100}
          placeholder={t("admin.transactions.fees.bankTxnPlaceholder")}
          value={bankTxnId}
          onChange={(event) => setBankTxnId(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fee-reason">
          {t("admin.transactions.fees.reasonLabel")}
        </Label>
        <Textarea
          id="fee-reason"
          rows={2}
          maxLength={500}
          placeholder={t("admin.transactions.fees.reasonPlaceholder")}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {isPending
          ? t("admin.transactions.fees.marking")
          : t("admin.transactions.fees.markSubmit")}
      </Button>
    </form>
  );
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
      <dd className="min-w-0 text-foreground">{children}</dd>
    </>
  );
}
