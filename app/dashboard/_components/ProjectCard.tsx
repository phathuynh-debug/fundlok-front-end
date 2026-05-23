import { ArrowRight, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/services/projects.service"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"

interface ProjectCardProps {
  project: Project
  role?: "SME" | "INVESTOR"
  actionLabel?: string
}

type ProjectAddress = {
  city?: string
  country?: string
}

export function ProjectCard({ project, role = "SME", actionLabel }: ProjectCardProps) {
  const { locale, t } = useTranslations()

  // Format dates safely
  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString(locale)
    : t("common.unknown")

  const incorporationDate = project.incorporation_date
    ? new Date(project.incorporation_date).toLocaleDateString(locale)
    : t("common.unknown")

  // Assuming address has city and country based on log
  const address = project.address as ProjectAddress | null | undefined
  const location = address?.city && address?.country
    ? `${address.city}, ${address.country}`
    : t("common.locationUnavailable")

  return (
    <Card className="p-4 md:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {project.legal_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.projectCard.created", { date: createdDate })}
          </p>
        </div>
        <Badge
          variant={project.status === "ACTIVE" ? "default" : "secondary"}
          className="rounded-full px-3 py-1 font-medium bg-black text-white hover:bg-black/80"
        >
          {project.status === "ACTIVE"
            ? t("dashboard.projectCard.status.active")
            : t("dashboard.projectCard.status.draft")}
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{t("dashboard.projectCard.industry")}</span>
          <span className="text-base font-semibold">{project.industry}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{t("dashboard.projectCard.taxId")}</span>
          <span className="text-base font-semibold">{project.tax_id}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{t("dashboard.projectCard.incorporation")}</span>
          <span className="text-base font-semibold text-emerald-600">{incorporationDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{t("dashboard.projectCard.location")}</span>
          <span className="text-base font-semibold">{location}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
        <Button asChild variant="outline" className="flex-1 w-full sm:w-auto justify-between text-muted-foreground hover:text-foreground">
          <Link href={`/dashboard/project-details?id=${project.id}`}>
            {t("dashboard.projectCard.viewDetails")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {role === "SME" ? (
          <Button variant="secondary" className="w-full sm:w-auto px-4 bg-muted">
            <Pencil className="h-4 w-4 mr-2" />
            {t("dashboard.projectCard.edit")}
          </Button>
        ) : (
          <Button className="w-full sm:w-auto px-6">
            {actionLabel || t("dashboard.projectCard.invest")}
          </Button>
        )}
      </div>
    </Card>
  )
}
