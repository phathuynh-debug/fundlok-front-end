import { ArrowRight, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/services/projects.service"

interface ProjectCardProps {
  project: Project
  role?: "SME" | "INVESTOR"
}

export function ProjectCard({ project, role = "SME" }: ProjectCardProps) {
  // Format dates safely
  const createdDate = project.created_at 
    ? new Date(project.created_at).toLocaleDateString()
    : "Unknown"
    
  const incorporationDate = project.incorporation_date
    ? new Date(project.incorporation_date).toLocaleDateString()
    : "Unknown"

  // Assuming address has city and country based on log
  const address = project.address as any
  const location = address?.city && address?.country 
    ? `${address.city}, ${address.country}` 
    : "Location unavailable"

  return (
    <Card className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {project.legal_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Created {createdDate}
          </p>
        </div>
        <Badge 
          variant={project.status === "ACTIVE" ? "default" : "secondary"}
          className="rounded-full px-3 py-1 font-medium bg-black text-white hover:bg-black/80"
        >
          {project.status || "DRAFT"}
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Industry</span>
          <span className="text-base font-semibold">{project.industry}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Tax ID</span>
          <span className="text-base font-semibold">{project.tax_id}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Incorporation</span>
          <span className="text-base font-semibold text-emerald-600">{incorporationDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Location</span>
          <span className="text-base font-semibold">{location}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-2">
        <Button variant="outline" className="flex-1 justify-between text-muted-foreground hover:text-foreground">
          View Project Details
          <ArrowRight className="h-4 w-4" />
        </Button>
        {role === "SME" ? (
          <Button variant="secondary" className="px-4 bg-muted">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <Button className="px-6">
            Invest
          </Button>
        )}
      </div>
    </Card>
  )
}
