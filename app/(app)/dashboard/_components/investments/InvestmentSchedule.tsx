"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReportMissingDay } from "@/hooks/use-repayment";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RepaymentRow } from "@/services/repayment.service";

const K = "dashboard.investor.investments";

/** Today in Vietnam, as the API's due dates are (YYYY-MM-DD). */
function todayIct(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

// Every repayment day of one investment, in order. A day that is due or that
// the business marked paid can be reported as never arrived; the business then
// has to prove it paid, and FundLok checks.
export function InvestmentSchedule({
  trancheId,
  rows,
}: {
  trancheId: string;
  rows: RepaymentRow[];
}) {
  const { t } = useTranslations();
  const withheld = rows.some((row) => row.tax_withheld_vnd > 0);
  const today = todayIct();

  return (
    <div className="space-y-2" data-testid="investment-schedule">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(`${K}.reportHint`)}
        {withheld && ` ${t(`${K}.taxNote`)}`}
      </p>
      <ul className="max-h-96 divide-y overflow-y-auto rounded-lg border">
        {rows.map((row) => (
          <ScheduleRow
            key={row.repayment_day_id}
            trancheId={trancheId}
            row={row}
            reportable={
              row.due_date <= today &&
              (row.status === "DUE" || row.status === "PRESUMED_PAID")
            }
          />
        ))}
      </ul>
    </div>
  );
}

function ScheduleRow({
  trancheId,
  row,
  reportable,
}: {
  trancheId: string;
  row: RepaymentRow;
  reportable: boolean;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const report = useReportMissingDay(trancheId);
  const [reporting, setReporting] = useState(false);
  const [statement, setStatement] = useState("");

  const send = () =>
    report.mutate(
      { dayId: row.repayment_day_id, statement: statement.trim() || null },
      {
        onSuccess: () => {
          toast({ title: t(`${K}.reportedToast`) });
          setReporting(false);
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: t(`${K}.reportFailed`),
            description:
              error.code === "REPORT_WINDOW_CLOSED"
                ? t(`${K}.reportClosed`)
                : apiErrorMessage(error, locale, t("common.tryAgain")),
          }),
      },
    );

  return (
    <li className="space-y-2 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground">
          {formatDate(row.due_date, locale)}
          <span className="ml-2 text-xs text-muted-foreground">
            {t(`${K}.kind.${row.kind}`)}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <span className="font-medium tabular-nums text-foreground">
            {formatCurrency(row.net_vnd, locale)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              row.status === "REPORTED_MISSED" &&
                "border-destructive/40 bg-destructive/10 text-destructive",
              (row.status === "PRESUMED_PAID" || row.status === "MATCHED") &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            )}
          >
            {t(`${K}.dayStatus.${row.status}`)}
          </Badge>
          {reportable && !reporting && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setReporting(true)}
            >
              {t(`${K}.report`)}
            </Button>
          )}
        </div>
      </div>
      {reporting && (
        <div className="space-y-2">
          <Textarea
            rows={2}
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            placeholder={t(`${K}.reportPlaceholder`)}
            aria-label={t(`${K}.reportPlaceholder`)}
            disabled={report.isPending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={report.isPending}
              onClick={send}
            >
              {t(`${K}.reportSend`)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={report.isPending}
              onClick={() => setReporting(false)}
            >
              {t(`${K}.cancel`)}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
