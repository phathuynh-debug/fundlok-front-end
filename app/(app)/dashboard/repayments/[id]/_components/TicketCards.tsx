"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Breakdown } from "../../../_components/funding/Breakdown";
import type { InvestmentDay } from "../../../_components/funding/investment-days";

const K = "dashboard.sme.investment";

const FILTERS = ["left", "paid", "all"] as const;
type Filter = (typeof FILTERS)[number];

const shows: Record<Filter, (day: InvestmentDay) => boolean> = {
  left: (day) => day.status !== "paid",
  paid: (day) => day.status === "paid",
  all: () => true,
};

// Every repayment ticket of one investment, one card per working day: the
// amount tax included, what the business transfers once it keeps the tax
// back, what it is made of, and whether it is paid. Opens on the tickets still
// to pay; projected tickets have no status, so they are all shown.
export function TicketCards({
  days,
  today,
  projected,
}: {
  days: InvestmentDay[];
  today: string;
  projected: boolean;
}) {
  const { t } = useTranslations();
  const [filter, setFilter] = useState<Filter>(projected ? "all" : "left");
  const shown = days.filter(shows[filter]);

  return (
    <section
      aria-labelledby="investment-tickets"
      className="space-y-3"
      data-testid="investment-tickets"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="investment-tickets"
          className="text-sm font-semibold text-foreground"
        >
          {t(`${K}.ticketsHeading`)}
        </h2>
        {!projected && (
          <div
            role="group"
            aria-label={t(`${K}.filterLabel`)}
            className="inline-flex rounded-lg border bg-muted/40 p-0.5"
          >
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                  filter === option &&
                    "bg-background text-foreground shadow-sm",
                )}
              >
                {t(`${K}.filters.${option}`, {
                  count: days.filter(shows[option]).length,
                })}
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          {t(`${K}.noTickets`)}
        </p>
      ) : (
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="investment-days"
        >
          {shown.map((day) => (
            <TicketCard
              key={day.due_date}
              day={day}
              isToday={day.due_date === today}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TicketCard({
  day,
  isToday,
}: {
  day: InvestmentDay;
  isToday: boolean;
}) {
  const { t, locale } = useTranslations();
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-4",
        day.status === "paid" && "border-emerald-500/30 bg-emerald-500/5",
        day.status === "missing" && "border-destructive/40",
        isToday && day.status !== "paid" && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {t(`${K}.dayIndex`, { index: day.index })}
            {isToday && ` · ${t(`${K}.today`)}`}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatDate(day.due_date, locale)}
          </p>
        </div>
        {day.status && (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0",
              day.status === "paid" &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              day.status === "missing" &&
                "border-destructive/40 bg-destructive/10 text-destructive",
              day.status === "due" &&
                "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
            )}
          >
            {t(`dashboard.sme.plan.status.${day.status}`)}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums text-foreground">
          {formatCurrency(day.gross_vnd, locale)}
        </p>
        {day.net_vnd !== day.gross_vnd && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {t("dashboard.sme.plan.transferShort", {
              net: formatCurrency(day.net_vnd, locale),
            })}
          </p>
        )}
      </div>
      <Breakdown row={day} />
    </li>
  );
}
