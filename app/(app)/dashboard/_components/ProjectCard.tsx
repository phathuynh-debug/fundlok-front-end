import {
  ArrowRight,
  Pencil,
  HelpCircle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Project } from "@/services/projects.service";
import {
  listingDaysLeft,
  listingFundedPercent,
  targetReturnVnd,
} from "@/lib/listing-figures";
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
  // The investor's target return: FundLok's bank rate in force, as the listing
  // returns it (bank_rate_pct), the same on every card.
  const expectedRoiPct = loanApplication?.bank_rate_pct ?? undefined;
  // Shown as money: that rate on the business's whole request.
  const expectedRoiVnd =
    expectedRoiPct !== undefined && askingAmount !== undefined
      ? targetReturnVnd(askingAmount, expectedRoiPct)
      : undefined;

  // Assuming address has city and country based on log
  const address = project.address as ProjectAddress | null | undefined;
  const location =
    address?.city && address?.country
      ? `${address.city}, ${address.country}`
      : t("common.locationUnavailable");

  // The funding round, from the listing: real figures, the same ones the
  // details page behind this card shows. These used to be derived from a hash
  // of the project id under a "sample figures" notice. Null until the request
  // has a contract and a listing.
  const listing = loanApplication?.listing ?? null;
  const fundingProgressPct = listing ? listingFundedPercent(listing) : 0;
  const daysRemaining = listing ? listingDaysLeft(listing) : null;
  const businessScore = loanApplication?.business_score ?? null;
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
          "pointer-events-none absolute inset-y-0 left-0 w-1 opacity-75 rounded-r-full",
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
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-medium rounded-full px-2.5 py-0.5 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-medium rounded-full px-2.5 py-0.5 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{t("dashboard.projectCard.hotDeal")}</span>
                  </Badge>
                )}
                {/* No "Low Risk" badge: it was hardcoded on every listing
                    regardless of the score, which is a blanket risk claim we
                    cannot support (Handbook §3.4, §8). The score badge below
                    carries the assessment, and the investor draws their own
                    conclusion from it. */}
                <Badge
                  variant="outline"
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 text-xs font-semibold rounded-full px-2.5 py-0.5"
                >
                  {businessScore === null
                    ? t("dashboard.projectCard.pendingGrading")
                    : t("dashboard.projectCard.score", {
                        score: businessScore.toFixed(2),
                      })}
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
            <span className="stat-label">
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
                <span className="stat-label">
                  {t("dashboard.projectCard.askingAmount")}
                </span>
                <span className="text-base font-bold tabular-nums text-foreground sm:text-lg">
                  {askingAmount === undefined
                    ? t("dashboard.projectCard.pending")
                    : formatCurrency(askingAmount, locale)}
                </span>
                {listing?.min_ticket != null && (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t("dashboard.projectCard.minTicket", {
                      amount: formatCurrency(listing.min_ticket, locale),
                    })}
                  </span>
                )}
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1">
                <span className="stat-label">
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
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t("dashboard.projectCard.dailyRepayment")}
                  </span>
                )}
              </div>

              {/* Hero Expected ROI Callout */}
              <div className="flex flex-col gap-1 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-teal-500/15 border border-emerald-500/30 p-3 shadow-2xs">
                <span className="stat-label flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                  {t("dashboard.projectCard.expectedRoi")}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("dashboard.projectCard.expectedRoiHint")}
                        className="text-emerald-600/70 hover:text-emerald-700 dark:text-emerald-400/70 dark:hover:text-emerald-300"
                      >
                        <HelpCircle className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {t("dashboard.projectCard.expectedRoiHint")}
                    </TooltipContent>
                  </Tooltip>
                </span>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    expectedRoiVnd === undefined
                      ? "text-muted-foreground"
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {expectedRoiVnd === undefined
                    ? "—"
                    : formatCurrency(expectedRoiVnd, locale)}
                </span>
                {/* Handbook §5.13 / §8: a projected return is never presented
                    as a promise. The figure carries the "target, not
                    guaranteed" disclaimer inline (the tooltip above expands
                    on it) — an investor must not be able to read it as a
                    fixed or guaranteed yield. */}
                {expectedRoiVnd !== undefined && (
                  <span className="break-words text-xs font-medium text-muted-foreground">
                    {t("dashboard.projectCard.roiBasis", {
                      rate: `${expectedRoiPct}%`,
                      amount: formatCurrency(askingAmount!, locale),
                    })}
                    {" · "}
                    {t("dashboard.projectCard.notGuaranteed")}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="stat-label">
                  {t("dashboard.projectCard.taxId")}
                </span>
                <span className="text-base font-semibold">
                  {project.tax_id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="stat-label">
                  {t("dashboard.projectCard.incorporation")}
                </span>
                <span className="text-base font-semibold">
                  {incorporationDate}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="stat-label">
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
          <span className="stat-label flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 shrink-0" />
            {t("dashboard.projectCard.loanPurpose")}
          </span>
          <p
            // Clamped for list rhythm; the full text is on hover and on the
            // details page.
            title={loanApplication?.purpose?.trim() || undefined}
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
        {role === "INVESTOR" && !listing && (
          <p className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/50 text-xs text-muted-foreground">
            {t("dashboard.projectCard.notOpenYet")}
          </p>
        )}
        {role === "INVESTOR" && listing && (
          <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground">
                  {t("dashboard.projectCard.fundedPercent", {
                    percent: fundingProgressPct,
                  })}
                </span>
                <span className="text-muted-foreground">
                  •{" "}
                  {t("dashboard.projectCard.raisedOfTarget", {
                    raised: formatCurrency(listing.funded_amount, locale),
                    target: formatCurrency(listing.target_amount, locale),
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {t("dashboard.projectCard.backers", {
                    count: listing.investor_count,
                  })}
                </span>
                {daysRemaining !== null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {t("dashboard.projectCard.daysLeft", {
                      count: daysRemaining,
                    })}
                  </span>
                )}
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
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200/70 dark:border-zinc-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {/* Was "Asset-Backed" — untrue and unsayable: we finance
                  without hard collateral, and the tag implied a security
                  behind the facility (Handbook §2, §8). The real basis is
                  verified revenue. */}
              {t("dashboard.projectCard.verifiedRevenue")}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200/70 dark:border-zinc-700/60">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {/* Repayment is a fixed amount every business day, not a
                  monthly amortising schedule (Handbook §5.4). */}
              {t("dashboard.projectCard.dailyRepayment")}
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
              "group/details w-full flex-1 justify-between py-2.5 rounded-xl transition-all duration-200 hover:border-primary/50 hover:bg-muted/70 bg-muted/20 font-semibold cursor-pointer",
              CONTROL_IDLE,
            )}
          >
            <Link href={`/dashboard/projects/${project.id}`}>
              <span>{t("dashboard.projectCard.viewDetails")}</span>
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
