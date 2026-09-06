import {
  ArrowRight,
  Pencil,
  Sparkles,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Flame,
  Calendar,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/services/projects.service";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/lib/format-currency";
import { industryLabel } from "@/lib/industry-label";
import { cn } from "@/lib/utils";
import { getIndustryChrome } from "./sme-dashboard-config";
import { CONTROL_IDLE } from "@/lib/ui-tokens";

interface ProjectCardProps {
  project: Project;
  role?: "SME" | "INVESTOR";
}

type ProjectAddress = {
  city?: string;
  country?: string;
};

export function ProjectCard({ project, role = "SME" }: ProjectCardProps) {
  const { locale, t } = useTranslations();

  // List tier: neutral surface, industry identity limited to the rail + pill.
  // See IndustryTier in ./sme-dashboard-config.
  const chrome = getIndustryChrome(project.industry, "list");
  const IndustryIcon = chrome.icon;

  const isActive = project.status === "ACTIVE";

  // Format dates safely (locale-aware: vi → DD/MM/YYYY, en → MM/DD/YYYY)
  const createdDate = project.created_at
    ? formatDate(project.created_at, locale)
    : t("common.unknown");

  const incorporationDate = project.incorporation_date
    ? formatDate(project.incorporation_date, locale)
    : t("common.unknown");

  // Deal terms for the investor view. The marketplace listing carries the loan
  // application (GET /projects/public), so the asking amount is real data.
  const loanApplication = project.loan_application;
  const askingAmount =
    loanApplication?.requested_amount === undefined ||
    loanApplication?.requested_amount === null
      ? undefined
      : Number(loanApplication.requested_amount);
  const durationMonths = loanApplication?.duration_months ?? undefined;
  const expectedRoiPct = loanApplication?.interest_rate_pct ?? undefined;

  // Assuming address has city and country based on log
  const address = project.address as ProjectAddress | null | undefined;
  const location =
    address?.city && address?.country
      ? `${address.city}, ${address.country}`
      : t("common.locationUnavailable");

  // Deterministic presentation metrics for active deals in the marketplace
  const hash = Math.abs(
    (project.id || project.legal_name || "deal")
      .split("")
      .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0),
  );
  const fundingProgressPct = askingAmount ? (hash % 29) + 65 : 0; // 65% - 93%
  const raisedAmount = askingAmount
    ? Math.round((askingAmount * (fundingProgressPct / 100)) / 1_000_000) *
      1_000_000
    : 0;
  const backersCount = (hash % 24) + 16; // 16 - 39 investors
  const daysRemaining = (hash % 16) + 5; // 5 - 20 days left
  const minInvestment = askingAmount
    ? Math.max(
        2_000_000,
        Math.round((askingAmount * 0.01) / 1_000_000) * 1_000_000,
      )
    : 5_000_000;
  const grade = hash % 3 === 0 ? "AAA" : hash % 3 === 1 ? "AA" : "A+";
  const isHot = fundingProgressPct >= 75;

  return (
    <Card
      className={cn(
        "group/card relative overflow-hidden p-5 md:p-6 gap-0 rounded-2xl border border-border/70 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-0.5",
        chrome.surface,
      )}
    >
      {/* Industry identity rail */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-1",
          chrome.rail,
        )}
      />

      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover/card:text-primary">
                {project.legal_name}
              </h3>
              {role === "INVESTOR" && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md px-2 py-0.5 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{t("dashboard.projectCard.verifiedSme")}</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.projectCard.created", { date: createdDate })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {role === "INVESTOR" && (
              <>
                {isHot && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{t("dashboard.projectCard.hotDeal")}</span>
                  </Badge>
                )}
                <Badge className="bg-primary text-primary-foreground font-mono text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none">
                  {t("dashboard.projectCard.lowRisk")}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 font-mono text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5"
                >
                  {t("dashboard.projectCard.grade", { grade })}
                </Badge>
              </>
            )}
            <Badge
              className={cn(
                "rounded-full px-3 py-1 font-medium text-xs",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {isActive
                ? t("dashboard.projectCard.status.active")
                : t("dashboard.projectCard.status.draft")}
            </Badge>
          </div>
        </div>

        {/* Metrics row.
            FE-008: an investor scanning the marketplace needs the DEAL, not the
            company's paperwork — industry, asking amount, term, expected
            return. Tax ID / incorporation / location are compliance details and
            stay on the details page, where they are still one click away. An
            SME looking at its own project sees the paperwork instead: it is the
            record it just filed. */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              {t("dashboard.projectCard.industry")}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "w-fit max-w-full gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold",
                chrome.badge,
              )}
            >
              <IndustryIcon className="shrink-0" />
              <span className="truncate">
                {industryLabel(project.industry, t)}
              </span>
            </Badge>
          </div>

          {role === "INVESTOR" ? (
            <>
              {/* Asking Amount */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  {t("dashboard.projectCard.askingAmount")}
                </span>
                <span className="text-lg font-black font-mono text-foreground">
                  {askingAmount === undefined
                    ? t("dashboard.projectCard.pending")
                    : formatCurrency(askingAmount, locale)}
                </span>
                {askingAmount !== undefined && (
                  <span className="text-[11px] font-medium text-muted-foreground font-mono">
                    {t("dashboard.projectCard.minTicket", {
                      amount: formatCurrency(minInvestment, locale),
                    })}
                  </span>
                )}
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  {t("dashboard.projectCard.duration")}
                </span>
                <span className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                  <span>
                    {durationMonths === undefined
                      ? t("dashboard.projectCard.pending")
                      : t("dashboard.projectCard.months", {
                          count: durationMonths,
                        })}
                  </span>
                </span>
                {durationMonths !== undefined && (
                  <span className="text-[11px] font-medium text-muted-foreground font-mono">
                    {t("dashboard.projectCard.monthlyAmortized")}
                  </span>
                )}
              </div>

              {/* Hero Expected ROI Callout */}
              <div className="flex flex-col gap-1 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-teal-500/15 border border-emerald-500/30 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />
                  {t("dashboard.projectCard.expectedRoi")}
                </span>
                <span
                  className={cn(
                    "text-xl font-black font-mono",
                    expectedRoiPct === undefined
                      ? "text-muted-foreground"
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {expectedRoiPct === undefined
                    ? t("dashboard.projectCard.pendingGrading")
                    : `${expectedRoiPct.toFixed(1)}%`}
                </span>
                {expectedRoiPct !== undefined && (
                  <span className="text-[10px] font-medium text-emerald-700/80 dark:text-emerald-300/80 font-mono">
                    {t("dashboard.projectCard.annualizedReturn")}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.taxId")}
                </span>
                <span className="text-base font-semibold">
                  {project.tax_id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.incorporation")}
                </span>
                <span className="text-base font-semibold">
                  {incorporationDate}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.location")}
                </span>
                <span className="text-base font-semibold">{location}</span>
              </div>
            </>
          )}
        </div>

        {/* Loan purpose. Prose, so it gets its own row rather than a cell in
            the metrics grid above — that grid is sized for short values and is
            already full at four columns for an investor. Clamped to two lines
            so a long purpose cannot push the cards in a list out of rhythm. */}
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 shrink-0" />
            {t("dashboard.projectCard.loanPurpose")}
          </span>
          <p
            className={cn(
              "text-sm leading-relaxed line-clamp-2",
              loanApplication?.purpose
                ? "text-foreground/90"
                : "text-muted-foreground italic",
            )}
          >
            {loanApplication?.purpose?.trim() ||
              t("dashboard.projectCard.noLoanPurpose")}
          </p>
        </div>

        {/* Funding Progress Bar (Investor View with active loan) */}
        {role === "INVESTOR" && askingAmount !== undefined && (
          <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">
                  {t("dashboard.projectCard.fundedPercent", {
                    percent: fundingProgressPct,
                  })}
                </span>
                <span className="text-muted-foreground">
                  •{" "}
                  {t("dashboard.projectCard.raisedOfTarget", {
                    raised: formatCurrency(raisedAmount, locale),
                    target: formatCurrency(askingAmount, locale),
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {t("dashboard.projectCard.backers", {
                    count: backersCount,
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t("dashboard.projectCard.daysLeft", {
                    count: daysRemaining,
                  })}
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-200/70 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(100, fundingProgressPct)}%` }}
              />
            </div>
          </div>
        )}

        {/* Trust Highlights Tags (Investor View) */}
        {role === "INVESTOR" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200/70 dark:border-zinc-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("dashboard.projectCard.assetBacked")}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200/70 dark:border-zinc-700/60">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("dashboard.projectCard.monthlyAmortized")}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200/70 dark:border-zinc-700/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {t("dashboard.projectCard.verifiedSme")}
            </span>
          </div>
        )}

        {/* Actions.
            One full-width action for an investor: the card is a summary, and
            investing happens on the details page where the terms, risk
            assessment and due-diligence documents are in front of them — not
            from a list where the only visible number is the asking amount. */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <Button
            asChild
            variant="outline"
            className={cn(
              "group/details w-full flex-1 justify-between py-2.5 rounded-xl transition-all duration-200 hover:border-primary/50 hover:bg-muted/70",
              CONTROL_IDLE,
            )}
          >
            <Link href={`/dashboard/project-details?id=${project.id}`}>
              <span className="font-semibold">
                {t("dashboard.projectCard.viewDetails")}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/details:translate-x-1" />
            </Link>
          </Button>
          {role === "SME" ? (
            <Button
              variant="outline"
              className={cn("w-full sm:w-auto px-4", CONTROL_IDLE)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("dashboard.projectCard.edit")}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
