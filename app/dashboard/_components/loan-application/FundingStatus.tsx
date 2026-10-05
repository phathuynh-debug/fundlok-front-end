import { Users } from "lucide-react";

/**
 * Where funding stands on an approved request: nothing has been invested.
 *
 * Approval is not funding. Investors fund the listing, and the listing only
 * exists once the SME has reviewed and signed the offer. There is no read API
 * for the listing or its investors yet, so this is a fixed statement rather
 * than a measurement. It replaced a panel of sample figures (an 87.5% funded
 * request with 14 investors) that had been on this dashboard for every SME,
 * approved or not. When that API exists, this is the place to show real
 * progress; until then it must not claim any.
 */
export function FundingStatus({ t }: { t: (key: string) => string }) {
  return (
    <section
      aria-label={t("dashboard.sme.funding.heading")}
      data-testid="funding-status"
      className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
    >
      <Users
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="space-y-0.5">
        <p className="stat-label">{t("dashboard.sme.funding.heading")}</p>
        <p className="text-sm font-bold text-foreground">
          {t("dashboard.sme.funding.none")}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("dashboard.sme.funding.noneHint")}
        </p>
      </div>
    </section>
  );
}
