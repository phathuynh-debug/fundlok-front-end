"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRepaymentPlan } from "@/hooks/use-funding";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, todayIct } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SmeRepaymentDay, SmeRound } from "@/services/funding.service";
import { Breakdown } from "./Breakdown";

const K = "dashboard.sme.plan";

// The business's daily repayments to its investors, one ticket per working
// day. Before the loan forms it is projected from the money confirmed so far
// (and grows as more investors join); once it has formed it is the real days,
// with how many of each day's investor payments are marked paid. Each amount
// is shown tax included (what the business repays) and as what it transfers to
// investors: the personal income tax (5% of the interest only) is deducted and
// kept back for the tax office. FundLok's fee is invoiced separately.
export function RepaymentPlan({ round }: { round: SmeRound }) {
  const { t, locale } = useTranslations();
  const plan = useRepaymentPlan(round.id);
  const [open, setOpen] = useState(false);
  const money = (vnd: number) => formatCurrency(vnd, locale);

  if (plan.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const data = plan.data;
  if (!data || data.days.length === 0) return null;

  const projected = data.kind === "PROJECTED";
  const [first, ...rest] = data.days;
  const last = data.days[data.days.length - 1];
  // The first day also carries the first-period interest: left out of the
  // everyday range, shown on its own. Each day is shown tax included (what it
  // repays) and as what it transfers to investors after keeping the tax back.
  const everyday = rest.length > 0 ? rest : [first];
  const range = (amounts: number[]) => {
    const low = Math.min(...amounts);
    const high = Math.max(...amounts);
    return low === high
      ? money(low)
      : t(`${K}.range`, { low: money(low), high: money(high) });
  };
  const withTax = data.totals.tax_withheld_vnd > 0;
  const split = (day: SmeRepaymentDay) =>
    day.gross_vnd === day.net_vnd
      ? money(day.gross_vnd)
      : t(`${K}.amountSplit`, {
          gross: money(day.gross_vnd),
          net: money(day.net_vnd),
        });
  const today = todayIct();
  const paidDays = data.days.filter(
    (d) => d.tickets > 0 && d.paid === d.tickets,
  ).length;
  const next = data.days.find((d) => d.due_date >= today && d.paid < d.tickets);

  return (
    <section
      aria-labelledby="repayment-plan"
      className="space-y-4 rounded-xl border border-border/60 bg-card p-4 md:p-5"
      data-testid="repayment-plan"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            id="repayment-plan"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {projected ? t(`${K}.headingProjected`) : t(`${K}.heading`)}
          </h3>
          {projected && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              {t(`${K}.badge`)}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void plan.refetch?.()}
          disabled={Boolean(plan.isFetching)}
          className="h-7 gap-1 px-2.5 text-xs font-medium cursor-pointer"
          aria-label={t("common.refresh")}
        >
          <RefreshCw
            className={`h-3 w-3 ${plan.isFetching ? "animate-spin" : ""}`}
          />
          <span>{t("common.refresh")}</span>
        </Button>
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Figure label={t(`${K}.perDay`)}>
          {range(everyday.map((d) => d.gross_vnd))}
        </Figure>
        {withTax && (
          <Figure label={t(`${K}.perDayNet`)}>
            {range(everyday.map((d) => d.net_vnd))}
          </Figure>
        )}
        <Figure label={t(`${K}.periods`)}>
          {t(`${K}.periodsValue`, {
            count: data.days.length,
            start: formatDate(first.due_date, locale),
            end: formatDate(last.due_date, locale),
          })}
        </Figure>
        <Figure label={t(`${K}.first`)}>
          {t(`${K}.firstValue`, {
            amount: split(first),
            date: formatDate(first.due_date, locale),
          })}
        </Figure>
        <Figure label={t(`${K}.totalGross`)}>
          {money(data.totals.gross_vnd)}
        </Figure>
        {withTax && (
          <Figure label={t(`${K}.total`)}>{money(data.totals.net_vnd)}</Figure>
        )}
        {data.totals.tax_withheld_vnd > 0 && (
          <Figure label={t(`${K}.taxKept`)}>
            {money(data.totals.tax_withheld_vnd)}
          </Figure>
        )}
        {!projected && (
          <Figure label={t(`${K}.progress`)}>
            {t(`${K}.progressValue`, {
              paid: paidDays,
              count: data.days.length,
            })}
          </Figure>
        )}
        {!projected && next && (
          <Figure label={t(`${K}.next`)}>
            {t(`${K}.firstValue`, {
              amount: split(next),
              date: formatDate(next.due_date, locale),
            })}
          </Figure>
        )}
      </dl>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {projected &&
          `${t(`${K}.projectedNote`, {
            confirmed: money(round.confirmed_vnd),
            date: data.assumed_close_date
              ? formatDate(data.assumed_close_date, locale)
              : "",
          })} `}
        {t(`${K}.note`)}
        {data.totals.tax_withheld_vnd > 0 &&
          ` ${t(`${K}.taxNote`, { tax: money(data.totals.tax_withheld_vnd) })}`}
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
          data-testid="repayment-plan-days"
        >
          {data.days.map((day) => (
            <PlanDay
              key={day.due_date}
              day={day}
              projected={projected}
              today={today}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PlanDay({
  day,
  projected,
  today,
}: {
  day: SmeRepaymentDay;
  projected: boolean;
  today: string;
}) {
  const { t, locale } = useTranslations();
  const settled = day.tickets > 0 && day.paid === day.tickets;
  const status = projected
    ? null
    : day.missing > 0
      ? "missing"
      : settled
        ? "paid"
        : day.due_date <= today
          ? "due"
          : "upcoming";

  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="block text-foreground">
          {formatDate(day.due_date, locale)}
          <span className="ml-2 text-xs text-muted-foreground">
            {t(`${K}.investors`, { count: day.tickets })}
          </span>
        </span>
        <Breakdown row={day} />
      </span>
      <span className="flex items-center gap-2">
        <span className="text-right">
          <span className="block font-medium tabular-nums text-foreground">
            {formatCurrency(day.gross_vnd, locale)}
          </span>
          {day.net_vnd !== day.gross_vnd && (
            <span className="block text-[11px] tabular-nums text-muted-foreground">
              {t(`${K}.transferShort`, {
                net: formatCurrency(day.net_vnd, locale),
              })}
            </span>
          )}
        </span>
        {status && (
          <Badge
            variant="outline"
            className={cn(
              status === "paid" &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              status === "missing" &&
                "border-destructive/40 bg-destructive/10 text-destructive",
              status === "due" &&
                "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
            )}
          >
            {t(`${K}.status.${status}`)}
          </Badge>
        )}
      </span>
    </li>
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
