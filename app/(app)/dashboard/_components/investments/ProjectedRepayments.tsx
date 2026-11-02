"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { ProjectedSchedule } from "@/services/repayment.service";
import { Breakdown } from "../funding/Breakdown";

const K = "dashboard.investor.investments.projected";

// What a received investment's repayment would look like, before the round
// closes and the loan forms: the same arithmetic the loan uses, assuming the
// round closes on its last day. Projected, never a promise (handbook: a range
// or an explicit qualifier, never a bare figure): the daily amount is shown as
// the range it spans, and the note says what can change it.
export function ProjectedRepayments({
  projection,
}: {
  projection: ProjectedSchedule;
}) {
  const { t, locale } = useTranslations();
  const [open, setOpen] = useState(false);
  const money = (vnd: number) => formatCurrency(vnd, locale);
  const instalments = projection.days.filter((d) => d.kind === "INSTALMENT");
  const stub = projection.days.find((d) => d.kind === "STUB");
  const range = (amounts: number[]) => {
    const low = Math.min(...amounts);
    const high = Math.max(...amounts);
    return low === high
      ? money(low)
      : t(`${K}.range`, { low: money(low), high: money(high) });
  };
  const withTax = projection.totals.tax_withheld_vnd > 0;
  const last = instalments[instalments.length - 1];
  // The first-period interest is paid with the first instalment, on the start date.
  const firstDays = projection.days.filter(
    (d) => d.due_date === projection.start_date,
  );
  const firstNet = firstDays.reduce((sum, d) => sum + d.net_vnd, 0);
  const firstGross = firstDays.reduce((sum, d) => sum + d.gross_vnd, 0);

  return (
    <div className="space-y-3" data-testid="projected-repayments">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-foreground">
          {t(`${K}.heading`)}
        </p>
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        >
          {t(`${K}.badge`)}
        </Badge>
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Figure label={t(`${K}.perDay`)}>
          {range(instalments.map((d) => d.net_vnd))}
        </Figure>
        {withTax && (
          <Figure label={t(`${K}.perDayGross`)}>
            {range(instalments.map((d) => d.gross_vnd))}
          </Figure>
        )}
        <Figure label={t(`${K}.periods`)}>
          {t(`${K}.periodsValue`, {
            count: projection.business_day_count,
            start: formatDate(instalments[0].due_date, locale),
            end: formatDate(last.due_date, locale),
          })}
        </Figure>
        <Figure label={t(`${K}.first`)}>
          {t(`${K}.firstValue`, {
            amount: withTax
              ? t("dashboard.investor.investments.amountSplit", {
                  net: money(firstNet),
                  gross: money(firstGross),
                })
              : money(firstNet),
            date: formatDate(projection.start_date, locale),
          })}
        </Figure>
        <Figure label={t(`${K}.total`)}>
          {money(projection.totals.net_vnd)}
        </Figure>
        {withTax && (
          <Figure label={t(`${K}.totalGross`)}>
            {money(projection.totals.gross_vnd)}
          </Figure>
        )}
        {stub && <Figure label={t(`${K}.stub`)}>{money(stub.net_vnd)}</Figure>}
      </dl>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(`${K}.note`, {
          date: formatDate(projection.assumed_close_date, locale),
        })}
        {projection.totals.tax_withheld_vnd > 0 &&
          ` ${t("dashboard.investor.investments.taxNote")}`}
      </p>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="-ml-2 gap-1.5"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {open ? t(`${K}.hide`) : t(`${K}.show`)}
      </Button>
      {open && (
        <ul
          className="max-h-96 divide-y overflow-y-auto rounded-lg border"
          data-testid="projected-days"
        >
          {projection.days.map((day) => (
            <li
              key={`${day.kind}-${day.day_index}`}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="block text-foreground">
                  {formatDate(day.due_date, locale)}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t(`dashboard.investor.investments.kind.${day.kind}`)}
                  </span>
                </span>
                <Breakdown row={day} />
              </span>
              <span className="text-right">
                <span className="block tabular-nums text-foreground">
                  {money(day.net_vnd)}
                </span>
                {day.tax_withheld_vnd > 0 && (
                  <span className="block text-[11px] tabular-nums text-muted-foreground">
                    {t("dashboard.investor.investments.inclTax", {
                      gross: money(day.gross_vnd),
                    })}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Figure({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}
