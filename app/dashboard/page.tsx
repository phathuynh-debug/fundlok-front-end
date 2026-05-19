"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLogout, useRequireAuth } from "@/hooks/use-authentication"
import { useMyProjects } from "@/hooks/use-projects"
import { SmeDashboard } from "./_components/SmeDashboard"
import { InvestorDashboard } from "./_components/InvestorDashboard"

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()
  const shouldLoadProjects = !isLoading && user?.role === "SME"
  const { data: projects = [], isLoading: isProjectsLoading } = useMyProjects(shouldLoadProjects)
  const { mutate: logout } = useLogout()

  console.log("projects", projects);
  useEffect(() => {
    if (user?.role === "SME" && !isProjectsLoading && projects.length === 0) {
      router.replace("/project-application")
    }
  }, [isProjectsLoading, projects.length, router, user?.role])

  if (isLoading || isProjectsLoading) {
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
      {/* Universal Dashboard Header (optional depending on your layout) */}
      <div className="border-b px-8 py-4 flex items-center justify-between bg-white/50 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Welcome, {user?.full_name || "Guest"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Account Role: <span className="uppercase font-semibold">{user?.role}</span>
          </p>
        </div>
        <button 
          onClick={() => logout()}
          className="text-sm font-medium hover:underline text-muted-foreground"
        >
          Logout
        </button>
      </div>

      {/* Render Role-Specific Dashboard */}
      {user?.role === "SME" ? (
        <SmeDashboard />
      ) : (
        <InvestorDashboard />
      )}
    </div>
  )
}
