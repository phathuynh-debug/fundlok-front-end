"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import type { InvestorLeadAdminItem } from "@/services/rates.service";

/**
 * One investor lead. Shows the choices at calculate time and, separately, at
 * sign-up time: the estimate stays live after calculating, so the two often
 * differ, and sales should open with the numbers the investor signed up on.
 * The board rate is shown here — it is internal data on an internal screen.
 */
export function InvestorLeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: {
  lead: InvestorLeadAdminItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useTranslations();
  if (!lead) return null;

  const when = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(iso))
      : "—";
  const pct = (value: number | null) =>
    value === null ? "—" : `${value.toFixed(2)}%`;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );

  const choicesBlock = (
    title: string,
    amount: number | null,
    months: number | null,
    tier: string | null,
    cadence: string | null,
    apy: number | null,
  ) => (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {row(
        t("admin.investorLeads.col.amount"),
        amount === null ? "—" : formatCurrency(amount, locale),
      )}
      {row(
        t("ratePage.investor.commitment"),
        months === null ? "—" : `${months} ${t("admin.investorLeads.months")}`,
      )}
      {row(
        t("ratePage.investor.risk"),
        tier ? t(`ratePage.investor.tier.${tier}`) : "—",
      )}
      {row(
        t("ratePage.investor.cadence"),
        cadence ? t(`ratePage.investor.cadenceOption.${cadence}`) : "—",
      )}
      {row(t("ratePage.investor.netApy"), pct(apy))}
    </section>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="space-y-2 border-b pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {lead.reference}
            </Badge>
            {lead.signed_up_at ? (
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400"
              >
                {t("admin.investorLeads.signedUp")}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {t("admin.investorLeads.calculatedOnly")}
              </Badge>
            )}
          </div>
          <SheetTitle>{lead.full_name}</SheetTitle>
          <SheetDescription>
            {lead.email}
            {lead.phone ? ` · ${lead.phone}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-5">
          {choicesBlock(
            t("admin.investorLeads.atCalculate"),
            lead.amount_vnd,
            lead.commitment_months,
            lead.risk_tier,
            lead.reinvestment_cadence,
            lead.net_apy_pct,
          )}
          {lead.signed_up_at &&
            choicesBlock(
              t("admin.investorLeads.atSignup"),
              lead.signup_amount_vnd,
              lead.signup_commitment_months,
              lead.signup_risk_tier,
              lead.signup_reinvestment_cadence,
              lead.signup_net_apy_pct,
            )}

          <Separator />

          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("admin.investorLeads.pricing")}
            </h3>
            {row(t("admin.investorLeads.boardRate"), pct(lead.bank_rate_pct))}
            {row(t("ratePage.investor.walkLoanRate"), pct(lead.loan_rate_pct))}
            {row(
              t("ratePage.investor.walkNetPerLoan"),
              pct(lead.net_per_loan_pct),
            )}
            {row(
              t("ratePage.investor.estReturn"),
              formatCurrency(lead.estimated_return_vnd, locale),
            )}
          </section>

          <Separator />

          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("admin.investorLeads.record")}
            </h3>
            {row(t("admin.investorLeads.col.date"), when(lead.created_at))}
            {row(
              t("admin.investorLeads.acknowledged"),
              when(lead.acknowledged_illustrative_at),
            )}
            {row(
              t("admin.investorLeads.consented"),
              when(lead.consented_contact_at),
            )}
            {row(t("admin.investorLeads.signedUpAt"), when(lead.signed_up_at))}
            {row(t("admin.investorLeads.language"), lead.locale ?? "—")}
            {row(t("admin.investorLeads.ip"), lead.ip_address ?? "—")}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
