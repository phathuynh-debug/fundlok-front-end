"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicProjects } from "@/hooks/use-projects";
import { useRequireAuth } from "@/hooks/use-authentication";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InvestmentKpis } from "./_components/InvestmentKpis";
import { RiskAssessmentTab } from "./_components/RiskAssessmentTab";
import { DueDiligenceTab } from "./_components/DueDiligenceTab";
import { useTranslations } from "@/lib/i18n";
import {
  pageTransitionProps,
  fadeInUpProps,
  tabContentAnimation,
} from "@/lib/animations";

type TabType = "risk" | "diligence";

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

export default function ProjectDetailsClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const [activeTab, setActiveTab] = useState<TabType>("risk");
  const { t } = useTranslations();

  const { user, isLoading: isAuthLoading } = useRequireAuth();

  // We load public projects to find the matching one
  const { data: projects = [], isLoading: isProjectsLoading } =
    usePublicProjects(!isAuthLoading && user?.role === "INVESTOR");

  const project = projects.find((p) => p.id === projectId);

  if (isAuthLoading || isProjectsLoading) {
    return <ProjectDetailsSkeleton />;
  }

  // Fallback details if no project found to make it look nice anyway
  const displayName =
    project?.legal_name || t("dashboard.projectDetails.fallbackName");
  const displayIndustry =
    project?.industry || t("dashboard.projectDetails.fallbackIndustry");

  return (
    <motion.div
      {...pageTransitionProps}
      className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto"
    >
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
            {t("dashboard.projectDetails.backToMarketplace")}
          </Link>
        </Button>
      </div>

      {/* Header section */}
      <motion.div {...fadeInUpProps} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {displayName}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-black text-white hover:bg-black/80 dark:bg-white dark:text-slate-950 rounded-full px-3 py-0.5 text-xs font-semibold">
                  {t("dashboard.projectDetails.lowRisk")}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-background text-foreground rounded-full px-3 py-0.5 text-xs font-semibold border-muted"
                >
                  {t("dashboard.projectDetails.grade")}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {displayIndustry}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {t("dashboard.projectDetails.description")}
        </p>
      </motion.div>

      {/* KPI Cards Row */}
      <motion.div {...fadeInUpProps}>
        <InvestmentKpis />
      </motion.div>

      {/* Tab pill selectors */}
      <motion.div
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
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("dashboard.projectDetails.riskAssessment")}
        </button>
        <button
          onClick={() => setActiveTab("diligence")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "diligence"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("dashboard.projectDetails.dueDiligence")}
        </button>
      </motion.div>

      {/* Active Tab Panel Content with Animated Transitions */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "risk" ? (
            <motion.div key="risk" {...tabContentAnimation}>
              <RiskAssessmentTab />
            </motion.div>
          ) : (
            <motion.div key="diligence" {...tabContentAnimation}>
              <DueDiligenceTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
