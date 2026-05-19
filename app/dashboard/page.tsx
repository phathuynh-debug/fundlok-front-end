"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLogout, useRequireAuth } from "@/hooks/use-authentication"
import { useMyProjects } from "@/hooks/use-projects"
import { SmeDashboard } from "./_components/SmeDashboard"
import { InvestorDashboard } from "./_components/InvestorDashboard"
import { LogOut, Home, Briefcase, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      {/* Universal Dashboard Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              {user?.role === "INVESTOR" ? (
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              ) : (
                <Briefcase className="h-6 w-6 text-blue-500" />
              )}
              <span>FundLok</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground ml-2">
              ({user?.role === "SME" ? "SME Portal" : "Investor Portal"})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 mr-4 text-sm font-medium">
              <span className="text-muted-foreground">
                Welcome back, <span className="text-foreground font-semibold">{user?.full_name || "Guest"}</span>
              </span>
            </div>

            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>

            <Button variant="outline" size="sm" onClick={() => logout()} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Render Role-Specific Dashboard */}
      {user?.role === "SME" ? (
        <SmeDashboard projects={projects} />
      ) : (
        <InvestorDashboard />
      )}
    </div>
  )
}
