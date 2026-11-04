"use client";

import Link from "next/link";
import { CalendarCheck, Loader2, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTodaysPayments } from "@/hooks/use-repayment";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RepaymentRow } from "@/services/repayment.service";
import { investmentHref } from "./RoundTickets";

const K = "dashboard.sme.repayments";

interface InvestorDue {
  trancheId: string;
  investor: string;
  reference: string;
  /** Still to pay: due today or earlier and not marked paid. */
  due: RepaymentRow[];
  /** Every unsettled row, marked paid or not. */
  rows: RepaymentRow[];
}

const sum = (rows: RepaymentRow[], field: "gross_vnd" | "net_vnd") =>
  rows.reduce((total, row) => total + row[field], 0);

/** Today's rows, one entry per investment, in the order they came. */
export function byInvestment(rows: RepaymentRow[]): InvestorDue[] {
  const out = new Map<string, InvestorDue>();
  for (const row of rows) {
    const entry = out.get(row.tranche_id) ?? {
      trancheId: row.tranche_id,
      investor: row.investor_display,
      reference: row.reference_code,
      due: [],
      rows: [],
    };
    entry.rows.push(row);
    if (row.status === "DUE") entry.due.push(row);
    out.set(row.tranche_id, entry);
  }
  return [...out.values()];
}

// What the business owes its investors today, and any earlier day not yet
// marked paid: one line per investor. Each is paid from that investment's
// page, which shows the investor's own account, a VietQR for the exact amount
// and where to upload the bank's receipt; uploading it marks the days paid.
export function TodaysRepayments() {
  const { t, locale } = useTranslations();
  const today = useTodaysPayments();
  const money = (vnd: number) => formatCurrency(vnd, locale);

  if (today.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const investors = byInvestment(today.data?.rows ?? []);
  const due = investors.flatMap((investor) => investor.due);
  const dueInvestorsCount = investors.filter(
    (investor) => investor.due.length > 0,
  ).length;
  const hasDue = due.length > 0;
  const dueGross = sum(due, "gross_vnd");
  const dueNet = sum(due, "net_vnd");

  return (
    <section
      aria-labelledby="todays-repayments"
      tabIndex={-1}
      className={cn(
        "scroll-mt-6 space-y-5 rounded-2xl p-5 transition-all md:p-6",
        hasDue
          ? "border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/[0.08] via-card to-card shadow-md ring-1 ring-amber-500/15 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30 dark:border-amber-500/40 dark:from-amber-500/[0.12]"
          : "border border-border/60 bg-card",
      )}
      data-testid="todays-repayments"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              hasDue
                ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                : "bg-muted text-muted-foreground",
            )}
            aria-hidden
          >
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3
                id="todays-repayments"
                className="text-base font-bold tracking-tight text-foreground md:text-lg"
              >
                {t(`${K}.heading`)}
              </h3>
              {hasDue && (
                <Badge
                  variant="outline"
                  className="border-amber-500/50 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300"
                >
                  <span
                    className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
                    aria-hidden
                  />
                  {t(`${K}.status.DUE`)} ({dueInvestorsCount})
                </Badge>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
              {t(`${K}.hint`)}
            </p>
          </div>
        </div>
      </div>

      {investors.length === 0 ? (
        <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {t(`${K}.none`)}
        </p>
      ) : (
        <>
          {hasDue && (
            <div className="rounded-xl border border-amber-500/30 bg-background/80 p-4 backdrop-blur-xs">
              <p className="text-base font-bold tabular-nums tracking-tight text-foreground md:text-lg">
                {t(`${K}.total`, { net: money(dueNet) })}
              </p>
              {dueGross !== dueNet && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <p>{t(`${K}.grossTotal`, { gross: money(dueGross) })}</p>
                  <p>{t(`${K}.withheld`, { tax: money(dueGross - dueNet) })}</p>
                </div>
              )}
            </div>
          )}

          <ul className="space-y-3">
            {investors.map((investor) => (
              <InvestorLine key={investor.trancheId} investor={investor} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function InvestorLine({ investor }: { investor: InvestorDue }) {
  const { t, locale } = useTranslations();
  const owing = investor.due.length > 0;
  const shown = owing ? investor.due : investor.rows;
  const dates = [...new Set(shown.map((row) => row.due_date))];
  const missing = investor.rows.some((row) => row.status === "REPORTED_MISSED");
  const net = sum(shown, "net_vnd");
  const gross = sum(shown, "gross_vnd");

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 text-sm transition-all md:p-5",
        owing
          ? "border-2 border-amber-500/35 bg-card shadow-xs hover:border-amber-500/70 hover:shadow-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25"
          : "border border-border/60 bg-muted/20",
      )}
      data-testid="repayment-ticket"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-bold text-foreground">
            {investor.investor}
          </p>
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {investor.reference}
          </span>
          {owing && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              {t(`${K}.status.DUE`)}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground md:text-sm">
          {t(`${K}.days`, {
            count: dates.length,
            dates: dates.map((date) => formatDate(date, locale)).join(", "),
          })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-right">
          {/* What to transfer; tax included beneath. */}
          <span className="block text-lg font-bold tabular-nums tracking-tight text-foreground md:text-xl">
            {formatCurrency(net, locale)}
          </span>
          {gross !== net && (
            <span className="block text-xs tabular-nums text-muted-foreground">
              {t(`${K}.inclTax`, { gross: formatCurrency(gross, locale) })}
            </span>
          )}
        </span>
        {owing ? (
          <Button
            asChild
            size="default"
            className="h-10 gap-2 px-4 font-semibold shadow-sm"
          >
            <Link href={investmentHref(investor.trancheId)}>
              <Wallet className="h-4 w-4" />
              {t(`${K}.pay`)}
            </Link>
          </Button>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              missing
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            )}
          >
            {t(`${K}.status.${missing ? "REPORTED_MISSED" : "PRESUMED_PAID"}`)}
          </Badge>
        )}
      </div>
    </li>
  );
}
