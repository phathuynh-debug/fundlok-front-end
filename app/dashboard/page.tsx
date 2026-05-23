"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-authentication"
import { useMyProjects } from "@/hooks/use-projects"
import { SmeDashboard } from "./_components/SmeDashboard"
import { InvestorDashboard } from "./_components/InvestorDashboard"
import { DashboardHeader } from "./_components/DashboardHeader"
import { Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()
  const { t } = useTranslations()
  const shouldLoadMyProjects = !isLoading && user?.role === "SME"

  const {
    data: myProjects = [],
    isLoading: isMyProjectsLoading,
    isFetching: isMyProjectsFetching
  } = useMyProjects(shouldLoadMyProjects)

  const isWaitingForRedirect = isMyProjectsLoading || isMyProjectsFetching

  useEffect(() => {
    if (user?.role === "SME" && !isWaitingForRedirect && myProjects.length === 0) {
      router.replace("/project-application")
    }
  }, [isWaitingForRedirect, myProjects.length, router, user?.role])

  if (isLoading || isMyProjectsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
              {t("common.loadingDashboard")}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      {/* Render Role-Specific Dashboard */}
      {user?.role === "SME" ? (
        <SmeDashboard projects={myProjects} />
      ) : (
        <InvestorDashboard />
      )}
    </div>
  )
}
