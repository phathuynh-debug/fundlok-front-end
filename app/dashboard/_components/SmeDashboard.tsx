import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Calendar, Clock, Hash, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/services/projects.service"

interface SmeDashboardProps {
  projects: Project[]
}

export function SmeDashboard({ projects }: SmeDashboardProps) {
  const project = projects[0]

  if (!project) return null;

  const createdDate = project.created_at ? new Date(project.created_at) : new Date();
  const daysActive = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
  const startDateStr = createdDate.toLocaleDateString();

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project: {project.legal_name}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Industry: {project.industry} &bull; Tax ID: {project.tax_id}
          </p>
        </div>
        <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"} className="text-sm px-3 py-1 bg-black text-white rounded-full">
          {project.status || "DRAFT"}
        </Badge>
      </div>

      {/* Key Details */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Industry</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mt-2">{project.industry}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tax ID</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mt-2">{project.tax_id}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incorporation Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mt-2">
              {project.incorporation_date ? new Date(project.incorporation_date).toLocaleDateString() : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Days Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mt-2">{Math.max(0, daysActive)} days</div>
          </CardContent>
        </Card>
      </div>

      {/* Project Address & Record Info */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Registered Address</h3>
          </div>
          
          <div className="space-y-4">
            {project.address ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Street</p>
                  <p className="font-medium">{(project.address as any).street || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">City</p>
                  <p className="font-medium">{(project.address as any).city || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">State/Province</p>
                  <p className="font-medium">{(project.address as any).state || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Postal Code</p>
                  <p className="font-medium">{(project.address as any).postal_code || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Country</p>
                  <p className="font-medium">{(project.address as any).country || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No address information provided.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">System Record Details</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Project ID (UUID)</p>
              <p className="font-mono text-sm bg-muted p-2 rounded-md break-all">{project.id}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created At</p>
                <p className="font-medium">{project.created_at ? new Date(project.created_at).toLocaleString() : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">{project.updated_at ? new Date(project.updated_at).toLocaleString() : "N/A"}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
