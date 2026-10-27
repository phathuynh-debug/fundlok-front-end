"use client";

import { useState, useSyncExternalStore } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useMyProjects, usePublicProjects } from "@/hooks/use-projects";
import { useRequireAuth } from "@/hooks/use-authentication";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InvestmentKpis } from "./_components/InvestmentKpis";
import { RiskAssessmentTab } from "./_components/RiskAssessmentTab";
import { DueDiligenceTab } from "./_components/DueDiligenceTab";
import { OwnerProjectView } from "./_components/OwnerProjectView";
import { ScoreLabel } from "./_components/ScoreLabel";
import { useTranslations } from "@/lib/i18n";
import { industryLabel } from "@/lib/industry-label";
import {
  pageTransitionProps,
  fadeInUpProps,
  tabContentAnimation,
} from "@/lib/animations";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

type TabType = "risk" | "diligence";

const emptySubscribe = () => () => {};

function ProjectDetailsSkeleton() {
  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto animate-pulse">
      {/* Back button */}
      <div>
        <Skeleton className="h-8 w-44 rounded-md" />
      </div>

      {/* Header section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-64 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-12 w-full max-w-3xl rounded-lg" />
      </div>

      {/* KPI Cards Row Skeleton */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      {/* Tab Pill Selector Skeleton */}
      <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-2xl" />

      {/* Main Content Card Skeleton */}
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}

export default function ProjectDetailsClient({
  projectId,
}: {
  projectId: string;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("risk");
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { t } = useTranslations();

  const { user, isLoading: isAuthLoading } = useRequireAuth();

  // An investor finds the project in the marketplace list; an SME opening
  // one of their own (the dashboard links here) gets it from their projects,
  // with their real figures instead of the marketplace's sample ones.
  const isOwnerView = user?.role === "SME";
  const { data: projects = [], isLoading: isProjectsLoading } =
    usePublicProjects(!isAuthLoading && user?.role === "INVESTOR");
  const { data: myProjects = [], isLoading: isMyProjectsLoading } =
    useMyProjects(!isAuthLoading && isOwnerView);

  const project = projects.find((p) => p.id === projectId);
  // The locked score run's business score, from the listing: the same figure
  // as the marketplace card the user clicked through from, and as the SME's
  // own approval summary. Null until a run is locked.
  const businessScore = project?.loan_application?.business_score ?? null;

  if (!isMounted || isAuthLoading || isProjectsLoading || isMyProjectsLoading) {
    return <ProjectDetailsSkeleton />;
  }

  if (isOwnerView) {
    return (
      <OwnerProjectView project={myProjects.find((p) => p.id === projectId)} />
    );
  }

  // Not on the marketplace (an unknown id, or a project taken off it): say so.
  // This used to render a made-up company ("TechStart Solutions") with sample
  // figures, which an investor could take for a real listing.
  if (!project) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn("gap-2 -ml-2", CONTROL_IDLE)}
        >
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
            {t("dashboard.projectDetails.backToMarketplace")}
          </Link>
        </Button>
        <p className="rounded-xl border bg-muted/20 p-6 text-sm text-muted-foreground">
          {t("dashboard.projectDetails.notFound")}
        </p>
      </div>
    );
  }

  const displayName = project.legal_name;
  const displayIndustry = industryLabel(project.industry, t) || "—";
  const description = project.loan_application?.purpose ?? null;
  const loanApplication = project.loan_application ?? null;
  const listing = loanApplication?.listing ?? null;

  return (
    <m.div
      {...pageTransitionProps}
      className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto"
    >
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn("gap-2 -ml-2", CONTROL_IDLE)}
        >
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
            {t("dashboard.projectDetails.backToMarketplace")}
          </Link>
        </Button>
      </div>

      {/* Header section */}
      <m.div {...fadeInUpProps} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {displayName}
              </h1>
              <div className="flex items-center gap-2">
                {/* No "Low Risk" badge — it was hardcoded on every project and
                    is a blanket risk claim we cannot support (Handbook §3.4,
                    §8). The grade badge carries the assessment. */}
                <Badge
                  variant="outline"
                  className="bg-background text-foreground rounded-full px-3 py-0.5 text-xs font-semibold border-muted"
                >
                  <ScoreLabel score={businessScore} />
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {displayIndustry}
            </p>
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </m.div>

      {/* KPI Cards Row. Real terms only: the asking amount and term from the
          request; the investor return and revenue share read "n/a" until the
          listing carries them (they used to be sample figures). Not rendered
          without a request, where InvestmentKpis would fall back to its demo
          set. */}
      {loanApplication && (
        <m.div {...fadeInUpProps}>
          <InvestmentKpis
            loanAmountVnd={Number(loanApplication.requested_amount)}
            interestRatePct={loanApplication.interest_rate_pct ?? undefined}
            paybackMonths={loanApplication.duration_months ?? undefined}
            minTicketVnd={listing?.min_ticket}
          />
        </m.div>
      )}

      {/* Tab pill selectors */}
      <m.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="bg-muted/40 p-1 rounded-2xl grid w-full max-w-2xl mx-auto grid-cols-2 gap-1 border"
      >
        <button
          onClick={() => setActiveTab("risk")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "risk"
              ? "bg-background text-foreground shadow-sm"
              : CONTROL_IDLE
          }`}
        >
          {t("dashboard.projectDetails.riskAssessment")}
        </button>
        <button
          onClick={() => setActiveTab("diligence")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "diligence"
              ? "bg-background text-foreground shadow-sm"
              : CONTROL_IDLE
          }`}
        >
          {t("dashboard.projectDetails.dueDiligence")}
        </button>
      </m.div>

      {/* Active Tab Panel Content with Animated Transitions */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "risk" ? (
            <m.div key="risk" {...tabContentAnimation}>
              <RiskAssessmentTab
                score={businessScore}
                projectId={projectId}
                listing={listing}
              />
            </m.div>
          ) : (
            <m.div key="diligence" {...tabContentAnimation}>
              <DueDiligenceTab
                documentTypes={
                  project?.loan_application?.verified_documents ?? []
                }
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}
