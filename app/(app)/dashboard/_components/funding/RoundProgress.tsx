"use client";

import { useState } from "react";
import { Loader2, Lock, Users } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCloseRoundEarly } from "@/hooks/use-funding";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { enumLabel } from "@/lib/enum-labels";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { lastTicketVnd } from "@/lib/listing-figures";
import { useTranslations } from "@/lib/i18n";
import type { SmeRound } from "@/services/funding.service";

const K = "dashboard.sme.funding";

// The round's figures: what investors confirmed against the target, what is
// still waiting on transfers, the minimum the round needs, and where the round
// stands. While it is open the business can close it early, once the minimum
// is confirmed; closing is final, so it asks first. Once less than a minimum
// ticket is left, it says only one investor taking exactly that can fill it.
export function RoundProgress({ round }: { round: SmeRound }) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const close = useCloseRoundEarly();
  const [asking, setAsking] = useState(false);
  const money = (vnd: number) => formatCurrency(vnd, locale);
  const open = round.status === "OPEN" || round.status === "FULL";
  const canClose = open && round.confirmed_vnd >= round.min_raise_vnd;
  // Less than a minimum ticket still open: only one last ticket of exactly
  // that amount fills it (funding-window.md I-6).
  const lastTicket =
    round.status === "OPEN"
      ? lastTicketVnd(round.capacity_vnd, round.min_ticket_vnd)
      : null;
  const investors = round.tickets.filter(
    (ticket) => ticket.status !== "EXPIRED" && ticket.status !== "VOID",
  ).length;

  const closeNow = () =>
    close.mutate(round.id, {
      onSuccess: () => toast({ title: t(`${K}.closedToast`) }),
      onError: (error) =>
        toast({
          variant: "destructive",
          title: t(`${K}.closeFailed`),
          description: apiErrorMessage(error, locale, t("common.tryAgain")),
        }),
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="stat-label flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
          {t(`${K}.heading`)}
        </p>
        <Badge variant="secondary">
          {enumLabel(t, "fundingWindowStatus", round.status)}
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-foreground">
          <span className="text-lg font-bold tabular-nums">
            {money(round.confirmed_vnd)}
          </span>{" "}
          <span className="text-muted-foreground">
            {t(`${K}.ofTarget`, { target: money(round.target_vnd) })}
          </span>
        </p>
        <Progress
          value={Math.min(
            100,
            round.target_vnd > 0
              ? (round.confirmed_vnd / round.target_vnd) * 100
              : 0,
          )}
          className="h-2"
          aria-label={t(`${K}.heading`)}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.details`, {
            reserved: money(round.reserved_vnd),
            count: investors,
            min: money(round.min_raise_vnd),
          })}
          {open &&
            ` · ${t(`${K}.closes`, { date: formatDate(round.window_end, locale), days: round.days_left })}`}
        </p>
      </div>

      {lastTicket !== null && (
        <Note testId="last-ticket-note">
          {t(`${K}.lastTicketNote`, {
            amount: money(lastTicket),
            min: money(round.min_ticket_vnd),
            date: formatDate(round.window_end, locale),
          })}
          {canClose && ` ${t(`${K}.lastTicketCloseEarly`)}`}
        </Note>
      )}
      {round.status === "CLOSING" && <Note>{t(`${K}.closingNote`)}</Note>}
      {round.status === "REPAYING" && round.repayment_start_date && (
        <Note>
          {t(`${K}.repayingNote`, {
            date: formatDate(round.repayment_start_date, locale),
          })}
        </Note>
      )}
      {round.status === "FAILED" && <Note>{t(`${K}.failedNote`)}</Note>}

      {open && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={!canClose || close.isPending}
            onClick={() => setAsking(true)}
          >
            {close.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {t(`${K}.closeEarly`)}
          </Button>
          {!canClose && (
            <p className="text-xs text-muted-foreground">
              {t(`${K}.closeEarlyHint`, { min: money(round.min_raise_vnd) })}
            </p>
          )}
        </div>
      )}

      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`${K}.closeTitle`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(`${K}.closeBody`, { confirmed: money(round.confirmed_vnd) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(`${K}.cancel`)}</AlertDialogCancel>
            <AlertDialogAction onClick={closeNow}>
              {t(`${K}.closeEarly`)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Note({
  children,
  testId,
}: {
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <p
      className="rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
      data-testid={testId}
    >
      {children}
    </p>
  );
}
