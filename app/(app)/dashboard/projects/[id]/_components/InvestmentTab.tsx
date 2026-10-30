import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Banknote } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { formatAmountInput, formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useVerificationGate } from "@/hooks/use-verification-gate";
import { useHasBankAccount } from "@/hooks/use-payment-accounts";
import { useFundingWindow, useMyTranches } from "@/hooks/use-funding";
import { BankAccountPrompt } from "../../../_components/BankAccountPrompt";
import { cn } from "@/lib/utils";
import {
  INVESTOR_TARGET_RETURN_PCT,
  targetReturnVnd,
  ticketBounds,
} from "@/lib/listing-figures";
import { LIVE_TRANCHE_STATUSES } from "@/services/funding.service";
import type { MarketplaceListing } from "@/services/projects.service";

const K = "investment.tab";

// The funding round and the investment form, from the project's funding
// window (ADR-009): confirmed and reserved totals, the window's own minimum
// ticket and what is still open as the bounds. Invest goes on to the terms and
// then the business's bank details (/dashboard/invest). An investor who already
// holds a ticket here gets a way back to its transfer details instead.
export function InvestmentTab({
  projectId,
  listing,
}: {
  projectId: string;
  listing: MarketplaceListing | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const { proceed } = useVerificationGate();
  // Repayments go back to the investor's own bank account, and the backend
  // refuses a reservation without an approved one (BANK_ACCOUNT_REQUIRED).
  const bankAccount = useHasBankAccount();
  const needsBankAccount = bankAccount.isLoaded && !bankAccount.hasAccount;

  const windowQuery = useFundingWindow(listing?.id ?? null);
  const fundingWindow = windowQuery.data ?? null;
  const tranches = useMyTranches(Boolean(fundingWindow));
  const myTicket = fundingWindow
    ? tranches.data?.find(
        (tranche) =>
          tranche.window_id === fundingWindow.id &&
          LIVE_TRANCHE_STATUSES.includes(tranche.status),
      )
    : undefined;

  if (listing && windowQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const target = fundingWindow?.target_vnd ?? 0;
  const confirmed = fundingWindow?.confirmed_vnd ?? 0;
  const reserved = fundingWindow?.reserved_vnd ?? 0;
  const percent = (value: number) =>
    target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const takenPercent = Math.floor(percent(confirmed + reserved));
  const bounds = fundingWindow ? ticketBounds(fundingWindow) : null;
  const open = fundingWindow?.status === "OPEN" && (bounds?.max ?? 0) > 0;

  // Investing requires an approved KYC. An unverified investor gets KYC in a
  // new tab; when it's approved that tab closes and this one goes on to
  // /dashboard/invest. The proxy still hard-gates that route, so a direct
  // visit is bounced to /kyc?next=… in the same tab as before.
  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsBankAccount || !bounds) return;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: "destructive",
        title: t(`${K}.invalidAmountTitle`),
        description: t(`${K}.validAmount`),
      });
      return;
    }

    if (numericAmount < bounds.min) {
      toast({
        variant: "destructive",
        title: t(`${K}.invalidAmountTitle`),
        description: t(`${K}.belowMinimum`, {
          amount: formatCurrency(bounds.min, locale),
        }),
      });
      return;
    }

    if (numericAmount > bounds.max) {
      toast({
        variant: "destructive",
        title: t(`${K}.amountTooHighTitle`),
        description: t(`${K}.maxRemainingAmount`, {
          amount: formatCurrency(bounds.max, locale),
        }),
      });
      return;
    }

    const params = new URLSearchParams({
      amount: String(numericAmount),
      projectId,
    });
    const target = `/dashboard/invest?${params.toString()}`;
    proceed(target, () => {
      setIsPending(true);
      router.push(target);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Funding Progress Card */}
      {fundingWindow && (
        <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {t(`${K}.fundingProgress`)}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {fundingWindow.status === "OPEN" ||
              fundingWindow.status === "FULL"
                ? t(`${K}.daysLeft`, {
                    days: fundingWindow.days_left,
                    date: formatDate(fundingWindow.window_end, locale),
                  })
                : t(`${K}.trackFunding`)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-muted-foreground">
                {t(`${K}.progress`)}
              </span>
              <span className="text-foreground">{takenPercent}%</span>
            </div>
            {/* Confirmed transfers, then reservations still being paid. */}
            <div
              className="flex w-full bg-muted h-3.5 rounded-full overflow-hidden"
              data-testid="funding-progress"
            >
              <div
                className="bg-foreground h-full transition-all duration-500 ease-out"
                style={{ width: `${percent(confirmed)}%` }}
              />
              <div
                className="bg-foreground/35 h-full transition-all duration-500 ease-out"
                style={{ width: `${percent(reserved)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2 border-t min-[420px]:grid-cols-3">
            {[
              { label: t(`${K}.confirmed`), value: confirmed },
              { label: t(`${K}.reserved`), value: reserved },
              { label: t(`${K}.remaining`), value: fundingWindow.capacity_vnd },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <p className="stat-label">{item.label}</p>
                <p className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums text-foreground">
                  {formatCurrency(item.value, locale)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {myTicket ? (
        <Card
          className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-4"
          data-testid="my-ticket"
        >
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {t(`${K}.yourTicketTitle`, {
                amount: formatCurrency(myTicket.amount_vnd, locale),
              })}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {myTicket.status === "RESERVED" || myTicket.status === "SIGNED"
                ? t(`${K}.yourTicketBody`)
                : t(`${K}.yourTicketConfirming`)}
            </p>
          </div>
          <Button asChild className="h-11 rounded-xl">
            <Link href={`/dashboard/invest?projectId=${projectId}`}>
              {t(`${K}.yourTicketCta`)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      ) : !open ? (
        <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            {fundingWindow?.status === "FULL"
              ? t(`${K}.fullTitle`)
              : t(`${K}.notOpenTitle`)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {fundingWindow?.status === "FULL"
              ? t(`${K}.fullBody`)
              : windowQuery.isError && windowQuery.error?.status !== 404
                ? t(`${K}.windowLoadFailed`)
                : t(fundingWindow ? `${K}.closedBody` : `${K}.notOpenBody`)}
          </p>
        </Card>
      ) : (
        <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {t(`${K}.makeInvestment`)}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t(`${K}.enterAmount`)}
            </p>
          </div>

          <form onSubmit={handleInvest} className="space-y-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="investmentAmount"
                className="text-sm font-semibold"
              >
                {t(`${K}.investmentAmount`)}
              </Label>
              {/* Trailing ₫, not a leading $: Vietnamese writes the symbol after
                the amount, and this input takes VND like every other money
                field on the platform. */}
              <div className="relative">
                <span className="absolute right-3.5 top-3 text-muted-foreground font-medium">
                  ₫
                </span>
                <NumericInput
                  id="investmentAmount"
                  placeholder={t(`${K}.placeholder`)}
                  className="pr-8 bg-muted/20 border-muted focus-visible:ring-1 focus-visible:ring-foreground py-5 rounded-xl text-base"
                  // Grouped as typed ("25.000.000" / "25,000,000"); the state
                  // keeps the bare digits.
                  value={formatAmountInput(amount, locale)}
                  onValueChange={setAmount}
                  disabled={isPending}
                  required
                />
              </div>

              {/* Quick investment amount presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  {
                    label: locale === "vi" ? "10 triệu" : "10M",
                    val: 10_000_000,
                  },
                  {
                    label: locale === "vi" ? "25 triệu" : "25M",
                    val: 25_000_000,
                  },
                  {
                    label: locale === "vi" ? "50 triệu" : "50M",
                    val: 50_000_000,
                  },
                  {
                    label: locale === "vi" ? "100 triệu" : "100M",
                    val: 100_000_000,
                  },
                  {
                    label: locale === "vi" ? "Tối đa" : "Max",
                    val: bounds!.max,
                  },
                ]
                  // Only amounts this window can take.
                  .filter(
                    (preset, i, all) =>
                      preset.val <= bounds!.max &&
                      preset.val >= bounds!.min &&
                      all.findIndex((p) => p.val === preset.val) === i,
                  )
                  .map((preset) => {
                    const isSelected = amount === String(preset.val);
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setAmount(String(preset.val))}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-lg font-semibold border transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
              </div>

              <p className="text-xs text-muted-foreground tracking-wide">
                {t(`${K}.minimum`, {
                  amount: formatCurrency(bounds!.min, locale),
                })}{" "}
                ·{" "}
                {t(`${K}.maximum`, {
                  amount: formatCurrency(bounds!.max, locale),
                })}
              </p>

              {/* What this amount targets: INVESTOR_TARGET_RETURN_PCT of it,
                  for the whole loan, as on the project's ROI card. A target,
                  and said so. */}
              {Number(amount) > 0 && (
                <div
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-xl border bg-muted/30 px-4 py-3"
                  data-testid="target-return"
                >
                  <span className="text-sm font-medium text-foreground">
                    {t(`${K}.targetReturn`)}
                  </span>
                  <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(targetReturnVnd(Number(amount)), locale)}
                  </span>
                  <span className="w-full text-xs text-muted-foreground">
                    {t("dashboard.projectCard.roiBasis", {
                      rate: `${INVESTOR_TARGET_RETURN_PCT}%`,
                      amount: formatCurrency(Number(amount), locale),
                    })}{" "}
                    · {t("dashboard.projectCard.notGuaranteed")}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <BankAccountPrompt t={t} audience="investor" />
              <Button
                type="submit"
                className="w-full py-5 h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
                disabled={isPending || needsBankAccount}
              >
                <Banknote className="h-4 w-4" />
                {isPending ? t(`${K}.processing`) : t(`${K}.investNow`)}
              </Button>
              <p className="text-center text-xs text-muted-foreground leading-relaxed px-4">
                {t(`${K}.agreement`)}
              </p>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
