"use client";

import { useState } from "react";
import {
  Calendar,
  Check,
  Copy,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Users,
  Shield,
  FileSpreadsheet,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { RateInquiryAdminItem } from "@/services/rates.service";
import { cn } from "@/lib/utils";

interface RateInquiryDetailSheetProps {
  inquiry: RateInquiryAdminItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RateInquiryDetailSheet({
  inquiry,
  open,
  onOpenChange,
}: RateInquiryDetailSheetProps) {
  const { t } = useTranslations();
  const [copiedId, setCopiedId] = useState(false);

  if (!inquiry) return null;

  const copyInquiryId = () => {
    if (typeof navigator !== "undefined" && inquiry.id) {
      navigator.clipboard.writeText(inquiry.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getTierBadge = (tier: string | null) => {
    const tUpper = (tier ?? "").toUpperCase();
    if (tUpper.includes("A")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {inquiry.tier_display || "Tier A"}
        </span>
      );
    }
    if (tUpper.includes("B")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {inquiry.tier_display || "Tier B"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        {inquiry.tier_display || "Tier C"}
      </span>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
        <SheetHeader className="space-y-2 pb-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {inquiry.id.slice(0, 8)}...
              </Badge>
              {getTierBadge(inquiry.risk_tier)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyInquiryId}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedId ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{t("admin.ratesTable.copiedId")}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t("admin.ratesTable.copyId")}</span>
                </>
              )}
            </Button>
          </div>
          <SheetTitle className="text-xl font-bold tracking-tight">
            {inquiry.industry_display || inquiry.industry}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {inquiry.created_at_formatted || inquiry.created_at || "—"}
            </span>
            {inquiry.ip_address && (
              <>
                <span>•</span>
                <span>IP: {inquiry.ip_address}</span>
              </>
            )}
          </SheetDescription>
          {(inquiry.full_name || inquiry.company_name) && (
            <p className="pt-1 text-sm">
              <span className="font-semibold text-foreground">
                {inquiry.full_name}
              </span>
              {inquiry.full_name && inquiry.company_name && (
                <span className="text-muted-foreground"> · </span>
              )}
              <span className="text-muted-foreground">
                {inquiry.company_name}
              </span>
            </p>
          )}
          {(inquiry.email || inquiry.phone) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
              {inquiry.email && (
                <a
                  href={`mailto:${inquiry.email}`}
                  className="text-foreground hover:underline"
                >
                  {inquiry.email}
                </a>
              )}
              {inquiry.phone && (
                <a
                  href={`tel:${inquiry.phone.replace(/[^0-9+]/g, "")}`}
                  className="font-mono text-muted-foreground hover:underline"
                >
                  {inquiry.phone}
                </a>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6 pt-5">
          {/* Facility Calculation Summary */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span>{t("admin.ratesDetail.loanTermsTitle")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  {t("admin.ratesTable.loanAsk")}
                </span>
                <p className="font-bold text-foreground text-sm">
                  {formatCurrency(inquiry.requested_amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inquiry.tenor_months} {t("ratePage.months")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  {t("admin.ratesTable.calculatedRate")}
                </span>
                <p className="font-bold text-primary text-sm">
                  {inquiry.calculated_rate_display ||
                    `${inquiry.estimated_rate_min}% - ${inquiry.estimated_rate_max}% / mo`}
                </p>
                {inquiry.apr_min && inquiry.apr_max && (
                  <p className="text-xs text-muted-foreground">
                    APR {inquiry.apr_min}% - {inquiry.apr_max}%
                  </p>
                )}
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-muted-foreground">
                  {t("admin.ratesTable.monthlyPayment")}
                </span>
                <p className="font-bold text-foreground text-sm">
                  {inquiry.calculated_monthly_payment_formatted ||
                    (inquiry.calculated_monthly_payment
                      ? formatCurrency(inquiry.calculated_monthly_payment)
                      : "—")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("ratePage.perMonth")}
                </p>
              </div>
            </div>
          </div>

          {/* Business & Operation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>{t("admin.ratesDetail.businessProfileTitle")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border p-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("admin.ratesTable.industry")}
                </span>
                <span className="font-medium text-sm">
                  {inquiry.industry_display || inquiry.industry}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("ratePage.operatingMonths")}
                </span>
                <span className="font-medium text-sm">
                  {inquiry.operating_months} {t("ratePage.months")}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("ratePage.employeeCount")}
                </span>
                <span className="font-medium text-sm">
                  {inquiry.employee_count} {t("admin.ratesDetail.staff")}
                </span>
              </div>
            </div>
          </div>

          {/* Financials & Growth */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>{t("admin.ratesDetail.financialsTitle")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("admin.ratesTable.revenueL12m")}
                </span>
                <span className="font-bold text-sm">
                  {inquiry.revenue_l12m_formatted ||
                    formatCurrency(inquiry.revenue_l12m)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("ratePage.revenuePrior")}
                </span>
                <span className="font-medium text-sm">
                  {formatCurrency(inquiry.revenue_prev_12m)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("admin.ratesTable.yoyGrowth")}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mt-0.5",
                    inquiry.yoy_growth_pct >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  )}
                >
                  {inquiry.yoy_growth_display ||
                    `${inquiry.yoy_growth_pct >= 0 ? "+" : ""}${inquiry.yoy_growth_pct}%`}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("ratePage.cogs")}
                </span>
                <span className="font-medium text-sm">
                  {formatCurrency(inquiry.cogs_l12m)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("ratePage.fixedCost")}
                </span>
                <span className="font-medium text-sm">
                  {formatCurrency(inquiry.fixed_costs_l12m)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("ratePage.variableCost")}
                </span>
                <span className="font-medium text-sm">
                  {formatCurrency(inquiry.variable_costs_l12m)}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>{t("admin.ratesDetail.riskMetricsTitle")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border p-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("admin.ratesDetail.ebitdaMargin")}
                </span>
                <span className="font-semibold text-sm">
                  {inquiry.ebitda_margin_pct != null
                    ? `${inquiry.ebitda_margin_pct}%`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("admin.ratesDetail.debtToRevenue")}
                </span>
                <span className="font-semibold text-sm">
                  {inquiry.debt_to_revenue_pct != null
                    ? `${inquiry.debt_to_revenue_pct}%`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("admin.ratesDetail.operatingStatus")}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    inquiry.is_operating_loss
                      ? "text-rose-500"
                      : "text-emerald-500",
                  )}
                >
                  {inquiry.is_operating_loss
                    ? t("admin.ratesDetail.operatingLoss")
                    : t("admin.ratesDetail.operatingProfit")}
                </span>
              </div>
            </div>
          </div>

          {/* Seasonality & Customer Concentration */}
          {(inquiry.peak_month_revenue ||
            inquiry.lowest_month_revenue ||
            inquiry.top_1_customer_share ||
            inquiry.top_3_customer_share) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                <span>{t("admin.ratesDetail.seasonalityTitle")}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("ratePage.bestMonth")}
                  </span>
                  <span className="font-medium text-sm">
                    {inquiry.peak_month_revenue
                      ? formatCurrency(inquiry.peak_month_revenue)
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("ratePage.worstMonth")}
                  </span>
                  <span className="font-medium text-sm">
                    {inquiry.lowest_month_revenue
                      ? formatCurrency(inquiry.lowest_month_revenue)
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("ratePage.top1")}
                  </span>
                  <span className="font-medium text-sm">
                    {inquiry.top_1_customer_share != null
                      ? `${inquiry.top_1_customer_share}%`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("ratePage.top3")}
                  </span>
                  <span className="font-medium text-sm">
                    {inquiry.top_3_customer_share != null
                      ? `${inquiry.top_3_customer_share}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Technical Metadata */}
          <div className="rounded-lg border bg-muted/10 p-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Globe className="h-3.5 w-3.5" />
              <span>{t("admin.ratesDetail.technicalTitle")}</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              {inquiry.session_id && (
                <div className="truncate">
                  <span className="text-muted-foreground">Session ID: </span>
                  <span className="text-foreground">{inquiry.session_id}</span>
                </div>
              )}
              {inquiry.user_agent && (
                <div className="truncate">
                  <span className="text-muted-foreground">User Agent: </span>
                  <span className="text-foreground">{inquiry.user_agent}</span>
                </div>
              )}
              <div className="truncate">
                <span className="text-muted-foreground">UUID: </span>
                <span className="text-foreground">{inquiry.id}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
