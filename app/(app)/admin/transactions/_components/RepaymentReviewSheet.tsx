"use client";

import { AlertTriangle, Info, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAdminRepaymentReceipt } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { AdminRepaymentAccount } from "@/services/admin-funding.service";
import { personName } from "./activity";
import { ReceiptViewer } from "./ReceiptViewer";
import { RepaymentStatusBadge } from "./RepaymentStatusBadge";
import { SystemCheckPanel } from "./SystemCheckPanel";
import { TransferHistory } from "./TransferHistory";

const K = "admin.transactions.repayments";

// The read-only panel for one business's repayment receipt.
//
// The investor the receipt pays checks their own account and confirms the
// money arrived; staff no longer approve or deny repayment receipts here, and
// only decide a missed-day dispute if the investor reports one.
export function RepaymentReviewSheet({
  receiptId,
  onOpenChange,
}: {
  receiptId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useTranslations();
  const { data, isLoading, isError } = useAdminRepaymentReceipt(receiptId);
  const money = (vnd: number) => formatCurrency(vnd, locale);

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

            {data.system_check && (
              <SystemCheckPanel check={data.system_check} subject="repayment" />
            )}

            <Separator />

            <section className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-px h-4 w-4 shrink-0" aria-hidden />
              <p>
                {data.needs_action
                  ? t(`${K}.sheet.awaitingInvestor`)
                  : t(`${K}.sheet.decided.${data.check_status}`)}
              </p>
            </section>

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
