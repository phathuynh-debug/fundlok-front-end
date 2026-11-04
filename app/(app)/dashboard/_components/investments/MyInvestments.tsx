"use client";

import { Loader2 } from "lucide-react";
import { useMyTranches } from "@/hooks/use-funding";
import { useTranslations } from "@/lib/i18n";
import type { Tranche } from "@/services/funding.service";
import { InvestmentCard } from "./InvestmentCard";
import { RepaymentReceipts } from "./RepaymentReceipts";

// Lapsed reservations were never investments.
export const isInvestment = (tranche: Tranche) => tranche.status !== "EXPIRED";

// The investor's own investments, newest first: where each stands and, once
// its loan has formed, what has been repaid and what comes next.
export function MyInvestments() {
  const { t } = useTranslations();
  const tranches = useMyTranches();
  const investments = (tranches.data ?? []).filter(isInvestment);
  const hasRepaying = investments.some(
    (tranche) => tranche.status === "ACTIVE",
  );

  if (tranches.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (investments.length === 0) return null;
  return (
    <div className="space-y-6">
      {hasRepaying && <RepaymentReceipts />}
      <section
        aria-labelledby="my-investments"
        className="space-y-4"
        data-testid="my-investments"
      >
        <h3
          id="my-investments"
          className="text-lg font-semibold text-foreground"
        >
          {t("dashboard.investor.investments.heading")}
        </h3>
        <div className="space-y-3">
          {investments.map((tranche) => (
            <InvestmentCard key={tranche.id} tranche={tranche} />
          ))}
        </div>
      </section>
    </div>
  );
}
