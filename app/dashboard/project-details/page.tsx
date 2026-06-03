"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { usePublicProjects } from "@/hooks/use-projects"
import { useRequireAuth } from "@/hooks/use-authentication"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { InvestmentKpis } from "./_components/InvestmentKpis"
import { RiskAssessmentTab } from "./_components/RiskAssessmentTab"
import { InvestmentTab } from "./_components/InvestmentTab"
import { DueDiligenceTab } from "./_components/DueDiligenceTab"
import { useTranslations } from "@/lib/i18n"

type TabType = "risk" | "diligence"

export default function ProjectDetailsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")
  const [activeTab, setActiveTab] = useState<TabType>("risk")
  const { t } = useTranslations()

  const { user, isLoading: isAuthLoading } = useRequireAuth()
  
  // We load public projects to find the matching one
  const { data: projects = [], isLoading: isProjectsLoading } = usePublicProjects(
    !isAuthLoading && user?.role === "INVESTOR"
  )

  const project = projects.find((p) => p.id === projectId)

  if (isAuthLoading || isProjectsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
              {t("common.loadingProjectDetails")}
          </span>
        </div>
      </div>
    )
  }

  // Fallback details if no project found to make it look nice anyway
  const displayName = project?.legal_name || t("dashboard.projectDetails.fallbackName")
  const displayIndustry = project?.industry || t("dashboard.projectDetails.fallbackIndustry")

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-black text-white hover:bg-black/80 rounded-full px-3 py-0.5 text-xs font-semibold">
                  {t("dashboard.projectDetails.lowRisk")}
                </Badge>
                <Badge variant="outline" className="bg-background text-foreground rounded-full px-3 py-0.5 text-xs font-semibold border-muted">
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
      </div>

      {/* KPI Cards Row */}
      <InvestmentKpis />

      {/* Tab pill selectors */}
      <div className="bg-muted/40 p-1 rounded-2xl grid w-full max-w-2xl mx-auto grid-cols-2 gap-1 border">
        <button 
          onClick={() => setActiveTab("risk")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === "risk" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("dashboard.projectDetails.riskAssessment")}
        </button>
        <button 
          onClick={() => setActiveTab("diligence")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === "diligence" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("dashboard.projectDetails.dueDiligence")}
        </button>
      </div>

      {/* Active Tab Panel Content */}
      <div className="mt-8">
        {activeTab === "risk" && <RiskAssessmentTab />}
        {activeTab === "diligence" && <DueDiligenceTab />}
      </div>
    </div>
  )
}
