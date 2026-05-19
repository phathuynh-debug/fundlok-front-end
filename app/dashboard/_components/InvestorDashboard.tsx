import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Layers, Map } from "lucide-react"
import type { Project } from "@/services/projects.service"
import { ProjectCard } from "./ProjectCard"

interface InvestorDashboardProps {
  projects: Project[]
}

export function InvestorDashboard({ projects }: InvestorDashboardProps) {
  const activeProjects = projects.filter(p => p.status === "ACTIVE" || p.status === "DRAFT").length;
  
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Investment Portfolio</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Track and manage your current investments
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Map className="h-6 w-6 text-blue-500" />
            <div className="text-3xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active/Draft Projects</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" />
            <div className="text-3xl font-bold">{activeProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-500" />
            <div className="text-3xl font-bold">1</div>
          </CardContent>
        </Card>
      </div>

      {/* Investment List */}
      <div className="space-y-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} role="INVESTOR" />
          ))
        ) : (
          <div className="text-center py-10 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No projects available for investment right now.</p>
          </div>
        )}
      </div>
    </div>
  )
}
