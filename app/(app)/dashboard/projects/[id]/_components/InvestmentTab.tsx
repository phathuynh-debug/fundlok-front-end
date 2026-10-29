import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Banknote } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { useVerificationGate } from "@/hooks/use-verification-gate";
import { useHasBankAccount } from "@/hooks/use-payment-accounts";
import { BankAccountPrompt } from "../../../_components/BankAccountPrompt";
import { cn } from "@/lib/utils";
import { listingFundedPercent, listingRemaining } from "@/lib/listing-figures";
import type { MarketplaceListing } from "@/services/projects.service";

// The funding round and the investment form, from the project's listing:
// real progress and amounts, and the listing's own minimum ticket and what is
// left as the bounds. These were constants (70% of 1.25 billion, a 375 million
// cap) on every project. With no open listing there is nothing to invest in,
// so the form gives way to a "not open yet" note.
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
  // Repayments go back to the investor's own bank account, and the order
  // endpoint refuses an investor without one (BANK_ACCOUNT_REQUIRED).
  const bankAccount = useHasBankAccount();
  const needsBankAccount = bankAccount.isLoaded && !bankAccount.hasAccount;

  const open = listing?.status === "OPEN";
  const progressPercent = listing ? listingFundedPercent(listing) : 0;
  const fundedAmount = listing?.funded_amount ?? 0;
  const remainingAmount = listing ? listingRemaining(listing) : 0;
  // What is left is the most one order can take (place_order refuses more).
  const maxAmount = remainingAmount;
  const minAmount = listing?.min_ticket ?? null;

  // Investing requires an approved KYC. An unverified investor gets KYC in a
  // new tab; when it's approved that tab closes and this one goes on to
  // /dashboard/invest. The proxy still hard-gates that route, so a direct
  // visit is bounced to /kyc?next=… in the same tab as before.
  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsBankAccount) return;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: "destructive",
        title: t("investment.tab.invalidAmountTitle"),
        description: t("investment.tab.validAmount"),
      });
      return;
    }

    if (minAmount !== null && numericAmount < minAmount) {
      toast({
        variant: "destructive",
        title: t("investment.tab.invalidAmountTitle"),
        description: t("investment.tab.belowMinimum", {
          amount: formatCurrency(minAmount, locale),
        }),
      });
      return;
    }

    if (numericAmount > maxAmount) {
      toast({
        variant: "destructive",
        title: t("investment.tab.amountTooHighTitle"),
        description: t("investment.tab.maxRemainingAmount", {
          amount: formatCurrency(maxAmount, locale),
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
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {t("investment.tab.fundingProgress")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("investment.tab.trackFunding")}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-muted-foreground">
              {t("investment.tab.progress")}
            </span>
            <span className="text-foreground">{progressPercent}%</span>
          </div>
          {/* Progress Bar Container */}
          <div className="w-full bg-muted h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-foreground h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Funded / Remaining Labels */}
        <div className="grid grid-cols-1 gap-4 pt-2 border-t min-[420px]:grid-cols-2">
          <div className="min-w-0">
            <p className="stat-label">{t("investment.tab.funded")}</p>
            <p className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums text-foreground sm:text-xl">
              {formatCurrency(fundedAmount, locale)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="stat-label">{t("investment.tab.remaining")}</p>
            <p className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums text-foreground sm:text-xl">
              {formatCurrency(remainingAmount, locale)}
            </p>
          </div>
        </div>
      </Card>

      {/* Make an Investment Card */}
      {!open ? (
        <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            {t("investment.tab.notOpenTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              listing
                ? "investment.tab.closedBody"
                : "investment.tab.notOpenBody",
            )}
          </p>
        </Card>
      ) : (
        <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {t("investment.tab.makeInvestment")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("investment.tab.enterAmount")}
            </p>
          </div>

          <form onSubmit={handleInvest} className="space-y-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="investmentAmount"
                className="text-sm font-semibold"
              >
                {t("investment.tab.investmentAmount")}
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
                  placeholder={t("investment.tab.placeholder")}
                  className="pr-8 bg-muted/20 border-muted focus-visible:ring-1 focus-visible:ring-foreground py-5 rounded-xl text-base"
                  value={amount}
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
                  { label: locale === "vi" ? "Tối đa" : "Max", val: maxAmount },
                ]
                  // Only amounts this listing can take.
                  .filter(
                    (preset, i, all) =>
                      preset.val <= maxAmount &&
                      (minAmount === null || preset.val >= minAmount) &&
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
                {minAmount !== null &&
                  `${t("investment.tab.minimum", {
                    amount: formatCurrency(minAmount, locale),
                  })} · `}
                {t("investment.tab.maximum", {
                  amount: formatCurrency(maxAmount, locale),
                })}
              </p>
            </div>

            <div className="space-y-3">
              <BankAccountPrompt t={t} audience="investor" />
              <Button
                type="submit"
                className="w-full py-5 h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
                disabled={isPending || needsBankAccount}
              >
                <Banknote className="h-4 w-4" />
                {isPending
                  ? t("investment.tab.processing")
                  : t("investment.tab.investNow")}
              </Button>
              <p className="text-center text-xs text-muted-foreground leading-relaxed px-4">
                {t("investment.tab.agreement")}
              </p>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
