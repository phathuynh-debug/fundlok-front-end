"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  useAdminRepaymentReceipt,
  useDecideRepaymentReceipt,
} from "@/hooks/use-admin-funding";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type {
  AdminRepaymentAccount,
  AdminRepaymentReceipt,
} from "@/services/admin-funding.service";
import { personName } from "./activity";
import { ReceiptViewer } from "./ReceiptViewer";
import { RepaymentStatusBadge } from "./RepaymentStatusBadge";
import { TransferHistory } from "./TransferHistory";
import { transferErrorMessage } from "./transfer-errors";

const K = "admin.transactions.repayments";

// The review panel for one business's repayment receipt.
//
// Built around the question staff answer: did this money reach the investor?
// So it shows what the receipt should show (the amount, the investor's
// account, the memo) next to the receipt itself, and staff approve or deny
// after looking. Approved, the days it pays are paid and settled; denied, they
// are due again and the business is told why, so a denial needs a note. Staff
// never decide a repayment they are part of.
export function RepaymentReviewSheet({
  receiptId,
  onOpenChange,
}: {
  receiptId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useTranslations();
  const { data, isLoading, isError } = useAdminRepaymentReceipt(receiptId);
  const { data: me } = useCurrentUser();
  const money = (vnd: number) => formatCurrency(vnd, locale);
  const own = Boolean(
    data && me && (data.business.id === me.id || data.investor.id === me.id),
  );

  return (
    <Sheet open={receiptId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {data
              ? t(`${K}.sheet.title`, {
                  business: personName(data.business) ?? "",
                  investor: personName(data.investor) ?? "",
                })
              : t(`${K}.sheet.titleFallback`)}
          </SheetTitle>
          <SheetDescription>
            {data?.project_name ?? t(`${K}.sheet.subtitle`)}
          </SheetDescription>
        </SheetHeader>

        {isError ? (
          <p role="alert" className="px-4 py-6 text-sm text-destructive">
            {t(`${K}.sheet.loadFailed`)}
          </p>
        ) : isLoading || !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 px-4 pb-8" data-testid="repayment-review">
            {/* --- The repayment --- */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {t(`${K}.sheet.repaymentHeading`)}
                </h3>
                <RepaymentStatusBadge receipt={data} />
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                <Row label={t(`${K}.sheet.transferred`)}>
                  <span className="font-semibold tabular-nums">
                    {money(data.net_vnd)}
                  </span>
                </Row>
                {data.tax_withheld_vnd > 0 && (
                  <Row label={t(`${K}.sheet.gross`)}>
                    <span className="tabular-nums">
                      {t(`${K}.sheet.grossValue`, {
                        gross: money(data.gross_vnd),
                        tax: money(data.tax_withheld_vnd),
                      })}
                    </span>
                  </Row>
                )}
                <Row label={t("admin.transactions.table.memo")}>
                  <span className="font-mono">{data.reference_code}</span>
                </Row>
                <Row label={t(`${K}.table.business`)}>
                  {data.business.email ?? personName(data.business)}
                </Row>
                <Row label={t(`${K}.table.investor`)}>
                  {data.investor.email ?? personName(data.investor)}
                </Row>
                <Row label={t(`${K}.table.submitted`)}>
                  {formatDateTime(data.submitted_at, locale)}
                </Row>
              </dl>
            </section>

            {data.open_report && data.needs_action && (
              <p className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-foreground">
                <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-destructive" />
                {t(`${K}.sheet.reported`)}
              </p>
            )}

            {/* --- What a matching receipt shows --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.transactions.sheet.expectedHeading")}
              </h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl border bg-muted/30 p-3 text-xs">
                <Row label={t("admin.transactions.fields.amount_vnd")}>
                  <span className="tabular-nums">{money(data.net_vnd)}</span>
                </Row>
                <Row label={t("admin.transactions.fields.memo")}>
                  {t("admin.transactions.sheet.memoContains").replace(
                    "{memo}",
                    data.reference_code,
                  )}
                </Row>
                <Row label={t(`${K}.sheet.to`)}>
                  <Account account={data.payee} />
                </Row>
                <Row label={t(`${K}.sheet.from`)}>
                  <Account account={data.payer} />
                </Row>
              </dl>
            </section>

            {/* --- The days it pays --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t(`${K}.sheet.daysHeading`, { count: data.days.length })}
              </h3>
              <ul
                className="divide-y rounded-xl border text-xs"
                data-testid="repayment-review-days"
              >
                {data.days.map((day) => (
                  <li
                    key={day.repayment_day_id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span>
                      <span className="font-medium text-foreground">
                        {formatDate(day.due_date, locale)}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {t(`${K}.kind.${day.kind}`)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">
                        {money(day.net_vnd)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          day.status === "MATCHED" &&
                            "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                          day.status === "REPORTED_MISSED" &&
                            "border-destructive/40 bg-destructive/10 text-destructive",
                        )}
                      >
                        {t(`${K}.dayStatus.${day.status}`)}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* --- The receipt --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.transactions.sheet.receiptHeading")}
              </h3>
              <ReceiptViewer
                key={data.id}
                repaymentReceiptId={data.id}
                filename={data.original_filename}
              />
            </section>

            <Separator />

            {!data.needs_action ? (
              <section className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-px h-4 w-4 shrink-0" aria-hidden />
                <p>{t(`${K}.sheet.decided.${data.check_status}`)}</p>
              </section>
            ) : own ? (
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground">
                {t(`${K}.sheet.own`)}
              </p>
            ) : (
              <DecisionForm key={data.id} receipt={data} />
            )}

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.transactions.sheet.historyHeading")}
              </h3>
              <TransferHistory trancheId={data.tranche_id} />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Account({ account }: { account: AdminRepaymentAccount | null }) {
  if (!account) return <>—</>;
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

// Approve or deny after looking at the receipt. Approving needs no note;
// denying does, since the business reads it and pays again.
function DecisionForm({ receipt }: { receipt: AdminRepaymentReceipt }) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const decide = useDecideRepaymentReceipt();
  const [reason, setReason] = useState("");
  const note = reason.trim();

  const send = (outcome: "APPROVED" | "DENIED") => {
    decide.mutate(
      { receiptId: receipt.id, body: { outcome, reason: note || null } },
      {
        onSuccess: () => toast({ title: t(`${K}.sheet.toast.${outcome}`) }),
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
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.sheet.decideBody`)}
        </p>
      </div>
      <Textarea
        rows={2}
        value={reason}
        disabled={decide.isPending}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t(`${K}.sheet.notePlaceholder`)}
        aria-label={t(`${K}.sheet.notePlaceholder`)}
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
          disabled={decide.isPending || !note}
          onClick={() => send("DENIED")}
        >
          <XCircle className="h-3.5 w-3.5" />
          {t("admin.transactions.sheet.deny")}
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t(`${K}.sheet.hint`)}
      </p>
    </section>
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
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </>
  );
}
