import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export function InvestmentTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const [amount, setAmount] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { t, locale } = useTranslations();

  const maxAmount = 15000;
  const progressPercent = 70.0;

  // Investing requires an approved KYC. Rather than gate the button here, we
  // hand off to the /dashboard/invest route, which the proxy hard-gates: an
  // unverified investor is bounced to /kyc?next=… and returned here after
  // approval. So this handler only validates the amount, then navigates.
  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: "destructive",
        title: t("investment.tab.validationErrorTitle"),
        description: t("investment.tab.validAmount"),
      });
      return;
    }

    if (numericAmount > maxAmount) {
      toast({
        variant: "destructive",
        title: t("investment.tab.validationErrorTitle"),
        description: t("investment.tab.maxRemainingAmount", {
          amount: `$${maxAmount.toLocaleString(locale)}`,
        }),
      });
      return;
    }

    setIsPending(true);
    const params = new URLSearchParams({ amount: String(numericAmount) });
    if (projectId) params.set("projectId", projectId);
    router.push(`/dashboard/invest?${params.toString()}`);
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
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("investment.tab.funded")}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">$35,000</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("investment.tab.remaining")}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">$15,000</p>
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
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-muted-foreground font-medium">
                $
              </span>
              <Input
                id="investmentAmount"
                type="number"
                placeholder={t("investment.tab.placeholder")}
                className="pl-8 bg-muted/20 border-muted focus-visible:ring-1 focus-visible:ring-foreground py-5 rounded-xl text-base"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              <DollarSign className="h-4 w-4" />
              {isPending
                ? t("investment.tab.processing")
                : t("investment.tab.investNow")}
            </Button>
            <p className="text-center text-xs text-muted-foreground/80 leading-relaxed px-4">
              {t("investment.tab.agreement")}
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
