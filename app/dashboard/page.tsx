"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-authentication"
import { useMyProjects } from "@/hooks/use-projects"
import { SmeDashboard } from "./_components/SmeDashboard"
import { InvestorDashboard } from "./_components/InvestorDashboard"
import { DashboardHeader } from "./_components/DashboardHeader"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()
  const shouldLoadMyProjects = !isLoading && user?.role === "SME"

  const { 
    data: myProjects = [], 
    isLoading: isMyProjectsLoading,
    isFetching: isMyProjectsFetching
  } = useMyProjects(shouldLoadMyProjects)

  const isWaitingForProjects = isMyProjectsLoading || (isMyProjectsFetching && myProjects.length === 0)

  useEffect(() => {
    if (user?.role === "SME" && !isWaitingForProjects && myProjects.length === 0) {
      router.replace("/project-application")
    }
  }, [isWaitingForProjects, myProjects.length, router, user?.role])

  if (isLoading || isWaitingForProjects) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading dashboard...
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
