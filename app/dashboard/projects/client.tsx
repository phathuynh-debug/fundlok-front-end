"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRequireAuth } from "@/hooks/use-authentication";
import { usePublicProjects } from "@/hooks/use-projects";
import type { Project } from "@/services/projects.service";
import { ProjectCard } from "../_components/ProjectCard";
import { DashboardHeader } from "../_components/DashboardHeader";
import { SampleDataNotice } from "../_components/SampleDataNotice";
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  Building2,
  ShoppingCart,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { dailyRepaymentAmount } from "@/lib/facility-terms";
import { industryLabel } from "@/lib/industry-label";

interface SecondaryMarketListing {
  id: string;
  legalName: string;
  industry: string;
  // Enum-ish keys rather than English prose: the card renders them through
  // i18n, so a locale switch translates them (dashboard.projects.secondary.*).
  status: "PERFORMING";
  /**
   * 0-100 business score. Not a letter and not a risk band: "A+"/"AA" is
   * rating-agency notation (fundlok-domain §4), and the standalone "Low risk"
   * badge that used to sit beside it was the same blanket claim the primary
   * marketplace card already removed — every listing wore it.
   */
  score: number;
  listedDate: string;
  /** i18n key suffix under dashboard.projects.secondary.reasons. */
  reasonKey: string;
  askingPrice: number;
  askingPricePremium: number;
  originalInvestment: number;
  loanPercentage: number;
  timeRemainingDays: number;
  totalActiveDays: number;
  actualRoi: number;
  actualRoiVsExpected: number;
  principalProgressPercent: number;
  /** The fixed amount this position receives each business day, VND. */
  dailyRepaymentVnd: number;
  consecutivePayments: number;
  totalPaymentsMade: number;
  totalPaymentsMissed: number;
}

const mockSecondaryMarket: SecondaryMarketListing[] = [
  {
    id: "sec-1",
    legalName: "TechStart Solutions",
    industry: "IT Services",
    status: "PERFORMING",
    score: 81,
    listedDate: "4/28/2026",
    reasonKey: "rebalancing",
    askingPrice: 537500000,
    askingPricePremium: 7.5,
    originalInvestment: 500000000,
    loanPercentage: 100,
    timeRemainingDays: 90,
    totalActiveDays: 90,
    actualRoi: 12.0,
    actualRoiVsExpected: 17.6,
    principalProgressPercent: 65,
    dailyRepaymentVnd: dailyRepaymentAmount(500_000_000, 13, 6),
    consecutivePayments: 26,
    totalPaymentsMade: 26,
    totalPaymentsMissed: 0,
  },
  {
    id: "sec-2",
    legalName: "GreenEnergy Corp",
    industry: "Manufacturing",
    status: "PERFORMING",
    score: 63,
    listedDate: "5/10/2026",
    reasonKey: "liquidity",
    askingPrice: 230000000,
    askingPricePremium: -8.0,
    originalInvestment: 250000000,
    loanPercentage: 50,
    timeRemainingDays: 60,
    totalActiveDays: 60,
    actualRoi: 10.5,
    actualRoiVsExpected: 5.0,
    principalProgressPercent: 40,
    dailyRepaymentVnd: dailyRepaymentAmount(250_000_000, 12, 4),
    consecutivePayments: 18,
    totalPaymentsMade: 18,
    totalPaymentsMissed: 0,
  },
  {
    id: "sec-3",
    legalName: "BioMed Labs",
    industry: "Healthcare & Pharmacy",
    status: "PERFORMING",
    score: 86,
    listedDate: "5/20/2026",
    reasonKey: "profitTaking",
    askingPrice: 780000000,
    askingPricePremium: 4.0,
    originalInvestment: 750000000,
    loanPercentage: 75,
    timeRemainingDays: 30,
    totalActiveDays: 150,
    actualRoi: 13.8,
    actualRoiVsExpected: 22.0,
    principalProgressPercent: 80,
    dailyRepaymentVnd: dailyRepaymentAmount(750_000_000, 14, 6),
    consecutivePayments: 35,
    totalPaymentsMade: 35,
    totalPaymentsMissed: 0,
  },
];

function SecondaryMarketCard({ listing }: { listing: SecondaryMarketListing }) {
  const { locale, t } = useTranslations();
  const isPremium = listing.askingPricePremium >= 0;
  const premiumText = t(
    `dashboard.projects.secondary.${isPremium ? "premium" : "discount"}`,
    {
      percent: Math.abs(listing.askingPricePremium).toFixed(1),
    },
  );

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md p-6 flex flex-col gap-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">
              {listing.legalName}
            </h3>
            <Badge
              variant="outline"
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] uppercase font-semibold tracking-wider rounded-md border-zinc-200 dark:border-zinc-700"
            >
              {industryLabel(listing.industry, t)}
            </Badge>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-semibold tracking-wider rounded-md border-emerald-500/20 flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {t(
                `dashboard.projects.secondary.status.${listing.status.toLowerCase()}`,
              )}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.projects.secondary.listedOn", {
              date: listing.listedDate,
            })}{" "}
            •{t(`dashboard.projects.secondary.reasons.${listing.reasonKey}`)}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* The "Low risk" badge that sat here is gone for the same reason
              it went from the primary card: it was on every listing, which
              makes it a blanket risk claim rather than an assessment. The
              score carries the assessment; the investor draws the conclusion. */}
          <Badge
            variant="outline"
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 text-[10px] uppercase font-semibold tracking-wider rounded-full px-2.5 py-0.5"
          >
            {t("dashboard.projects.secondary.score", { score: listing.score })}
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-2">
        {/* Asking Price */}
        <div className="space-y-1">
          <span className="stat-label block">
            {t("dashboard.projects.secondary.askingPrice")}
          </span>
          <div className="text-xl font-bold text-foreground">
            {formatCurrency(listing.askingPrice, locale)}
          </div>
          <span
            className={`text-xs font-semibold ${isPremium ? "text-orange-500" : "text-emerald-500"}`}
          >
            {premiumText}
          </span>
        </div>

        {/* Original Investment */}
        <div className="space-y-1">
          <span className="stat-label block">
            {t("dashboard.projects.secondary.originalInvestment")}
          </span>
          <div className="text-xl font-bold text-foreground">
            {formatCurrency(listing.originalInvestment, locale)}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {t("dashboard.projects.secondary.ofLoan", {
              percent: listing.loanPercentage,
            })}
          </span>
        </div>

        {/* Time Remaining */}
        <div className="space-y-1">
          <span className="stat-label block">
            {t("dashboard.projects.secondary.timeRemaining")}
          </span>
          <div className="text-xl font-bold text-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground/70 shrink-0" />
            <span>
              {t("dashboard.projects.secondary.days", {
                count: listing.timeRemainingDays,
              })}
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {t("dashboard.projects.secondary.daysActive", {
              count: listing.totalActiveDays,
            })}
          </span>
        </div>

        {/* Actual ROI */}
        <div className="space-y-1">
          <span className="stat-label block">
            {t("dashboard.projects.secondary.actualRoi")}
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {listing.actualRoi.toFixed(1)}%
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {t("dashboard.projects.secondary.vsExpected", {
              percent: listing.actualRoiVsExpected.toFixed(1),
            })}
          </span>
        </div>

        {/* Principal Progress */}
        <div className="space-y-1">
          <span className="stat-label block">
            {t("dashboard.projects.secondary.principalProgress")}
          </span>
          <div className="text-xl font-bold text-foreground">
            {listing.principalProgressPercent}%
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {t("dashboard.projects.secondary.dailyRepaymentPerDay", {
              amount: formatCurrency(listing.dailyRepaymentVnd, locale),
            })}
          </span>
        </div>
      </div>

      {/* Gray Details Boxes Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-slate-900/50 border border-zinc-200/50 dark:border-zinc-800/40">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t("dashboard.projects.secondary.paymentHistory")}
          </h4>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {t("dashboard.projects.secondary.consecutivePayments", {
              count: listing.consecutivePayments,
            })}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t("dashboard.projects.secondary.madeMissed", {
              made: listing.totalPaymentsMade,
              missed: listing.totalPaymentsMissed,
            })}
          </p>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t("dashboard.projects.secondary.dailyRepayment")}
          </h4>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {t("dashboard.projects.secondary.dailyRepaymentTerms", {
              amount: formatCurrency(listing.dailyRepaymentVnd, locale),
            })}
          </p>
        </div>
      </div>

      {/* Footer Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button className="flex-1 rounded-xl bg-slate-950 hover:bg-slate-900 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-slate-950 py-3 text-sm font-semibold transition-all duration-300 shadow-xs active:scale-98 flex items-center justify-center gap-2 cursor-pointer">
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span>{t("dashboard.projects.secondary.viewAndPurchase")}</span>
        </button>
        <button className="rounded-xl border border-border hover:bg-muted text-foreground px-6 py-3 text-sm font-semibold transition-all duration-300 active:scale-98 flex items-center justify-center gap-2 cursor-pointer">
          <ArrowRightLeft className="w-4 h-4 shrink-0" />
          <span>{t("dashboard.projects.secondary.compare")}</span>
        </button>
      </div>
    </div>
  );
}

function ProjectsSkeletonList() {
  return (
    <div className="grid gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-xs animate-pulse"
        >
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-56 rounded-md" />
              <Skeleton className="h-3.5 w-36 rounded-md" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-full sm:w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

import {
  pageTransitionProps,
  staggerContainerVariants,
  springItemVariants,
} from "@/lib/animations";
import { CONTROL_HOVER, CONTROL_IDLE } from "@/lib/ui-tokens";

export default function ProjectsClient() {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const { t } = useTranslations();
  const { data: publicProjects = [], isLoading: isProjectsLoading } =
    usePublicProjects(!isAuthLoading && user?.role === "INVESTOR");

  const [marketType, setMarketType] = useState<"primary" | "secondary">(
    "primary",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(t("common.all"));

  const isInitialLoading = isAuthLoading || isProjectsLoading;

  // Enrich marketplace primary projects with realistic benchmark deal terms when
  // underwriting/grading fields (duration_months, interest_rate_pct) are pending from backend
  const enrichedPublicProjects = publicProjects.map((project, idx) => {
    if (!project.loan_application) return project;
    const seed = `${project.id}-${project.legal_name}-${idx}`;
    const hash = Math.abs(
      seed
        .split("")
        .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0),
    );

    // Realistic SME loan durations: 6, 9, 12, or 18 months
    const benchmarkDurations = [12, 9, 6, 12, 18];
    const derivedDuration =
      benchmarkDurations[hash % benchmarkDurations.length];

    // Realistic market returns: 12.8% - 15.2% p.a.
    const benchmarkRates = [14.2, 13.5, 15.2, 12.8, 14.8, 13.9];
    const derivedRate = benchmarkRates[hash % benchmarkRates.length];

    return {
      ...project,
      loan_application: {
        ...project.loan_application,
        duration_months:
          project.loan_application.duration_months ?? derivedDuration,
        interest_rate_pct:
          project.loan_application.interest_rate_pct ?? derivedRate,
      },
    };
  });

  // Active datasource based on selection
  const activeDataSource =
    marketType === "primary" ? enrichedPublicProjects : mockSecondaryMarket;

  const industries = [
    t("common.all"),
    ...Array.from(
      new Set(
        activeDataSource
          .map((p) => ("legal_name" in p ? p.industry : p.industry))
          .filter(Boolean),
      ),
    ),
  ];

  const activeIndustry = industries.includes(selectedIndustry)
    ? selectedIndustry
    : t("common.all");

  const filteredItems = (
    marketType === "primary" ? enrichedPublicProjects : mockSecondaryMarket
  ).filter((item) => {
    const name = "legal_name" in item ? item.legal_name : item.legalName;
    const matchesSearch =
      name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry =
      activeIndustry === t("common.all") || item.industry === activeIndustry;
    return matchesSearch && matchesIndustry;
  });

  // Handle active marketplace toggle to reset filters
  const handleMarketToggle = (type: "primary" | "secondary") => {
    setMarketType(type);
    setSearchTerm("");
    setSelectedIndustry(t("common.all"));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <motion.div
        {...pageTransitionProps}
        className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {marketType === "primary"
                ? t("dashboard.projects.title")
                : t("dashboard.projects.secondaryTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {marketType === "primary"
                ? t("dashboard.projects.subtitle")
                : t("dashboard.projects.secondarySubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-semibold w-fit border border-emerald-500/20">
            <Briefcase className="h-4 w-4" />
            <span>
              {marketType === "primary"
                ? t("dashboard.projects.opportunitiesAvailable", {
                    count: publicProjects.length,
                  })
                : t("dashboard.projects.showingListings", {
                    shown: filteredItems.length,
                    total: mockSecondaryMarket.length,
                  })}
            </span>
          </div>
        </div>

        {/* Market Toggle Pill Selector */}
        <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/40 w-fit flex items-center gap-1">
          <button
            onClick={() => handleMarketToggle("primary")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold uppercase transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              marketType === "primary"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-border/10"
                : `${CONTROL_IDLE} bg-transparent border border-transparent`
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t("dashboard.projects.primaryMarket")}</span>
          </button>
          <button
            onClick={() => handleMarketToggle("secondary")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold uppercase transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              marketType === "secondary"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-border/10"
                : `${CONTROL_IDLE} bg-transparent border border-transparent`
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{t("dashboard.projects.secondaryMarket")}</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-2">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("dashboard.projects.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t("dashboard.projects.filterLabel")}
            </span>
            {industries.map((industry) => (
              <Badge
                key={industry}
                variant={activeIndustry === industry ? "default" : "outline"}
                className={`cursor-pointer rounded-full transition-all ${
                  activeIndustry === industry
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : CONTROL_HOVER
                }`}
                onClick={() => setSelectedIndustry(industry)}
              >
                {industry === t("common.all")
                  ? industry
                  : industryLabel(industry, t)}
              </Badge>
            ))}
          </div>
        </div>

        {/* The card mixes real application data with presentation figures
            derived from the project id — funding progress, investor count,
            days remaining and the business score. An investor reading
            "Score 73/100" as a real assessment is exactly the misreading the
            handbook's disclosure rules exist to prevent (§3), so the page
            says which half is which. */}
        <SampleDataNotice message={t("dashboard.projectCard.sampleNotice")} />

        {/* Count display label below search/filters */}
        <div className="text-xs font-semibold text-muted-foreground tracking-wide">
          {isInitialLoading ? (
            <Skeleton className="h-4 w-40 rounded-sm" />
          ) : (
            t("dashboard.projects.showingListings", {
              shown: filteredItems.length,
              total: activeDataSource.length,
            })
          )}
        </div>

        {/* Market Listing Section with Loading & Open Up Animation */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {isInitialLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProjectsSkeletonList />
              </motion.div>
            ) : filteredItems.length > 0 ? (
              <motion.div
                key={`${marketType}-${activeIndustry}-${searchTerm}`}
                variants={staggerContainerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-6"
              >
                {marketType === "primary"
                  ? (filteredItems as Project[]).map((project) => (
                      <motion.div
                        key={project.id}
                        variants={springItemVariants}
                      >
                        <ProjectCard project={project} role="INVESTOR" />
                      </motion.div>
                    ))
                  : (filteredItems as SecondaryMarketListing[]).map(
                      (listing) => (
                        <motion.div
                          key={listing.id}
                          variants={springItemVariants}
                        >
                          <SecondaryMarketCard listing={listing} />
                        </motion.div>
                      ),
                    )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-center py-16 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center p-6"
              >
                <Briefcase className="h-10 w-10 text-muted-foreground/60 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {marketType === "primary"
                    ? t("dashboard.projects.noProjectsTitle")
                    : t("dashboard.projects.secondaryEmptyTitle")}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {marketType === "primary"
                    ? t("dashboard.projects.noProjectsDescription")
                    : t("dashboard.projects.secondaryEmptyDescription")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
