"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/use-authentication"
import { usePublicProjects } from "@/hooks/use-projects"
import { ProjectCard } from "../_components/ProjectCard"
import { DashboardHeader } from "../_components/DashboardHeader"
import { Loader2, Search, SlidersHorizontal, Briefcase } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n"

export default function ProjectsPage() {
  const { user, isLoading: isAuthLoading } = useRequireAuth()
  const { t } = useTranslations()
  const { data: publicProjects = [], isLoading: isProjectsLoading } = usePublicProjects(
    !isAuthLoading && user?.role === "INVESTOR"
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState(t("common.all"))

  if (isAuthLoading || isProjectsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
              {t("common.loadingProjects")}
          </span>
        </div>
      </div>
    )
  }

  const industries = [t("common.all"), ...Array.from(new Set(publicProjects.map((p) => p.industry).filter(Boolean)))]
  const activeIndustry = industries.includes(selectedIndustry) ? selectedIndustry : t("common.all")

  const filteredProjects = publicProjects.filter((project) => {
    const matchesSearch =
      project.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = activeIndustry === t("common.all") || project.industry === activeIndustry
    return matchesSearch && matchesIndustry
  })

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("dashboard.projects.title")}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t("dashboard.projects.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-semibold w-fit border border-emerald-500/20">
            <Briefcase className="h-4 w-4" />
            <span>{t("dashboard.projects.opportunitiesAvailable", { count: publicProjects.length })}</span>
          </div>
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
                    ? "bg-black text-white hover:bg-black/90"
                    : "hover:bg-accent"
                }`}
                onClick={() => setSelectedIndustry(industry)}
              >
                {industry}
              </Badge>
            ))}
          </div>
        </div>

        {/* Projects Listing */}
        <div className="space-y-6">
          {filteredProjects.length > 0 ? (
            <div className="grid gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  role="INVESTOR"
                  actionLabel={t("dashboard.projects.investNow")}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center p-6">
              <Briefcase className="h-10 w-10 text-muted-foreground/60 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("dashboard.projects.noProjectsTitle")}</h3>
              <p className="text-muted-foreground max-w-md">{t("dashboard.projects.noProjectsDescription")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
