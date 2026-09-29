import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Banknote } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { useVerificationGate } from "@/hooks/use-verification-gate";

export function InvestmentTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const [amount, setAmount] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const { proceed } = useVerificationGate();

  // VND, matching every other money surface. 375M is the mock per-investor cap.
  const maxAmount = 375_000_000;
  const progressPercent = 70.0;

  // Derived, not hardcoded: the funded/remaining figures used to be literal
  // "$35,000"/"$15,000" strings, which both missed the VND conversion and could
  // silently disagree with the progress bar above them.
  const targetAmount = 1_250_000_000;
  const fundedAmount = (targetAmount * progressPercent) / 100;
  const remainingAmount = targetAmount - fundedAmount;

  // Investing requires an approved KYC. An unverified investor gets KYC in a
  // new tab; when it's approved that tab closes and this one goes on to
  // /dashboard/invest. The proxy still hard-gates that route, so a direct
  // visit is bounced to /kyc?next=… in the same tab as before.
  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: "destructive",
        title: t("investment.tab.invalidAmountTitle"),
        description: t("investment.tab.validAmount"),
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

    const params = new URLSearchParams({ amount: String(numericAmount) });
    if (projectId) params.set("projectId", projectId);
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
            <span className="text-foreground">
              {progressPercent.toFixed(1)}%
            </span>
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
            <Label htmlFor="investmentAmount" className="text-sm font-semibold">
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
            <p className="text-xs text-muted-foreground tracking-wide">
              {t("investment.tab.maximum")}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full py-5 h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
              disabled={isPending}
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
    </div>
  );
}
