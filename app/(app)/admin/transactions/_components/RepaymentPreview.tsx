"use client";

import { useState } from "react";
import { Calculator, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminRepaymentPreview } from "@/hooks/use-admin-funding";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { ProjectedDay } from "@/services/repayment.service";

const K = "admin.transactions.preview";

/** One working day's ticket: its rows that day added up (day one also carries
 *  the first-period interest). */
function byDay(days: ProjectedDay[]) {
  const out = new Map<
    string,
    { due_date: string; gross: number; net: number }
  >();
  for (const day of days) {
    const entry = out.get(day.due_date) ?? {
      due_date: day.due_date,
      gross: 0,
      net: 0,
    };
    entry.gross += day.gross_vnd;
    entry.net += day.net_vnd;
    out.set(day.due_date, entry);
  }
  return [...out.values()].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

// The repayment approving this investment starts, worked out step by step
// beside the decision: approved, the money is received and the loan works at
// once, so repayment starts the next working day. Once repaying, the same
// steps show the days it got. Shown only for a ticket with money to approve.
export function RepaymentPreview({ trancheId }: { trancheId: string }) {
  const { t, locale } = useTranslations();
  const preview = useAdminRepaymentPreview(trancheId);
  const [open, setOpen] = useState(false);

  if (preview.isLoading) {
    return (
      <div className="flex h-16 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // No money to approve yet, or approval does not start a repayment.
  if (!preview.data) return null;

  const { basis, kind, totals } = preview.data;
  const money = (vnd: number) => formatCurrency(vnd, locale);
  const pct = (value: string) =>
    Number(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
      maximumFractionDigits: 2,
    });
  const date = (value: string) => formatDate(value, locale);
  const days = byDay(preview.data.days);
  const first = days[0];

  const steps = [
    t(`${K}.steps.principal`, { principal: money(basis.principal_vnd) }),
    basis.investor_return_pct !== null
      ? t(`${K}.steps.return`, {
          return: pct(basis.investor_return_pct),
          term: basis.term_months,
          rate: pct(basis.investor_rate_pct),
          loanRate: pct(basis.loan_rate_pct),
          interest: money(basis.interest_vnd),
        })
      : t(`${K}.steps.rate`, {
          rate: pct(basis.investor_rate_pct),
          term: basis.term_months,
          interest: money(basis.interest_vnd),
        }),
    t(`${K}.steps.days`, {
      term: basis.term_months,
      perMonth: basis.working_days_per_month,
      count: basis.business_day_count,
    }),
    basis.final_vnd === basis.daily_vnd
      ? t(`${K}.steps.daily`, {
          principal: money(basis.principal_vnd),
          interest: money(basis.interest_vnd),
          count: basis.business_day_count,
          daily: money(basis.daily_vnd),
        })
      : t(`${K}.steps.dailyWithLast`, {
          principal: money(basis.principal_vnd),
          interest: money(basis.interest_vnd),
          count: basis.business_day_count,
          daily: money(basis.daily_vnd),
          last: money(basis.final_vnd),
        }),
    t(kind === "PREVIEW" ? `${K}.steps.datesPreview` : `${K}.steps.dates`, {
      approved: date(basis.approved_on),
      start: date(basis.start_date),
      end: date(basis.end_date),
    }),
    ...(basis.stub_interest_vnd > 0
      ? [
          t(`${K}.steps.stub`, {
            received: date(basis.received_on),
            days: basis.stub_days,
            principal: money(basis.principal_vnd),
            rate: pct(basis.investor_rate_pct),
            basis: basis.stub_basis_days,
            stub: money(basis.stub_interest_vnd),
          }),
        ]
      : []),
    basis.individual
      ? t(`${K}.steps.tax`, {
          tax: pct(basis.withholding_pct),
          amount: money(basis.tax_vnd),
        })
      : t(`${K}.steps.noTax`),
  ];

  return (
    <section className="space-y-3" data-testid="repayment-preview">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          {t(kind === "PREVIEW" ? `${K}.headingPreview` : `${K}.heading`)}
        </h3>
        {kind === "PREVIEW" && (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          >
            {t(`${K}.ifApproved`)}
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-muted/30 p-3 text-xs">
        <Figure label={t(`${K}.start`)}>{date(basis.start_date)}</Figure>
        <Figure label={t(`${K}.end`)}>
          {t(`${K}.endValue`, {
            date: date(basis.end_date),
            count: basis.business_day_count,
          })}
        </Figure>
        {first && (
          <Figure label={t(`${K}.firstDay`)}>
            {first.gross === first.net
              ? money(first.gross)
              : t(`${K}.split`, {
                  gross: money(first.gross),
                  net: money(first.net),
                })}
          </Figure>
        )}
        <Figure label={t(`${K}.total`)}>
          {totals.gross_vnd === totals.net_vnd
            ? money(totals.gross_vnd)
            : t(`${K}.split`, {
                gross: money(totals.gross_vnd),
                net: money(totals.net_vnd),
              })}
        </Figure>
      </dl>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">
          {t(`${K}.howHeading`)}
        </p>
        <ol
          className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground"
          data-testid="repayment-preview-steps"
        >
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

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
        {open ? t(`${K}.hideDays`) : t(`${K}.showDays`)}
      </Button>
      {open && (
        <ol
          className="max-h-64 divide-y overflow-y-auto rounded-lg border text-xs"
          data-testid="repayment-preview-days"
        >
          {days.map((day, index) => (
            <li
              key={day.due_date}
              className="flex items-center justify-between gap-3 px-3 py-1.5"
            >
              <span className="text-muted-foreground">
                {t(`${K}.dayIndex`, { index: index + 1 })}
                <span className="ml-2 text-foreground">
                  {date(day.due_date)}
                </span>
              </span>
              <span className="tabular-nums">
                <span className="font-medium text-foreground">
                  {money(day.gross)}
                </span>
                {day.net !== day.gross && (
                  <span className="ml-2 text-muted-foreground">
                    {t(`${K}.transferShort`, { net: money(day.net) })}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
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
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">{children}</dd>
    </div>
  );
}
