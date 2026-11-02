"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SmeRound, SmeTicket } from "@/services/funding.service";

const K = "dashboard.sme.funding";

// Lapsed reservations were never investments: left out.
const SHOWN = (ticket: SmeTicket) => ticket.status !== "EXPIRED";

// Money received: the investment has repayment tickets, real or projected.
const HAS_TICKETS = (ticket: SmeTicket) =>
  ticket.status === "ACTIVE" || ticket.status === "CONFIRMED";

/** The business's page for one investment: its tickets and today's payment. */
export const investmentHref = (ticketId: string) =>
  `/dashboard/repayments/${ticketId}`;

// Each investor's ticket, masked as everywhere the business looks. FundLok
// staff check each transfer against its receipt, and their approval means the
// money is received: there is nothing for the business to confirm here. Once
// received, an investment opens its own page of repayment tickets.
export function RoundTickets({ round }: { round: SmeRound }) {
  const { t, locale } = useTranslations();
  const tickets = round.tickets.filter(SHOWN);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t(`${K}.ticketsHeading`)}
        </p>
        {tickets.some(HAS_TICKETS) && (
          <p className="text-xs text-muted-foreground">
            {t(`${K}.ticketsHint`)}
          </p>
        )}
      </div>
      {tickets.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t(`${K}.noTickets`)}</p>
      ) : (
        <ul className="divide-y rounded-lg border" data-testid="round-tickets">
          {tickets.map((ticket) => {
            const received = HAS_TICKETS(ticket);
            const summary = (
              <>
                <span className="min-w-0 font-medium text-foreground">
                  {ticket.investor_display}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {ticket.reference_code}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(ticket.amount_vnd, locale)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      received &&
                        "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {t(`${K}.ticketStatus.${ticket.status}`)}
                  </Badge>
                  {received && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
              </>
            );
            return (
              <li key={ticket.id} className="text-sm">
                {received ? (
                  <Link
                    href={investmentHref(ticket.id)}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                    title={t(`${K}.openTickets`)}
                  >
                    {summary}
                  </Link>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    {summary}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
