"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Calendar, Clock, Hash, CheckCircle2, Upload, FileText, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { filesService } from "@/services/files.service"
import type { Project } from "@/services/projects.service"
import { useTranslations } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type ProjectAddress = {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}
import { getIndustryTheme } from "./sme-dashboard-config"


interface SmeDashboardProps {
  projects: Project[]
}

export function SmeDashboard({ projects }: SmeDashboardProps) {
  const project = projects[0]
  const { toast } = useToast()
  const { locale, t } = useTranslations()

  const [files, setFiles] = useState<{
    taxFiling: File | null
    vatFiling: File | null
    financialStatement: File | null
    businessPlan: File | null
  }>({
    taxFiling: null,
    vatFiling: null,
    financialStatement: null,
    businessPlan: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!project) return null

  const isVi = locale === 'vi';
  const theme = getIndustryTheme(project.industry);

  const createdDate = project.created_at ? new Date(project.created_at) : new Date()
  const daysActive = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24))

  const handleFileChange = (key: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({
        ...prev,
        [key]: e.target.files![0],
      }))
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.taxFiling || !files.vatFiling) {
      toast({
        variant: "destructive",
        title: t("dashboard.sme.requiredDocsMissingTitle"),
        description: t("dashboard.sme.requiredDocsMissingDescription"),
      })
      return
    }

    setIsSubmitting(true)
    try {
      const uploadPromises = []

      if (files.taxFiling) {
        uploadPromises.push(filesService.uploadDocument(project.id, "KYC_BUSINESS_REG", files.taxFiling))
      }
      if (files.vatFiling) {
        uploadPromises.push(filesService.uploadDocument(project.id, "KYC_BUSINESS_REG", files.vatFiling))
      }
      if (files.financialStatement) {
        uploadPromises.push(filesService.uploadDocument(project.id, "BANK_STATEMENT", files.financialStatement))
      }
      if (files.businessPlan) {
        uploadPromises.push(filesService.uploadDocument(project.id, "OTHER", files.businessPlan))
      }

      await Promise.all(uploadPromises)

      setIsSubmitted(true)
      toast({
        title: t("dashboard.sme.applicationSubmittedTitle"),
        description: t("dashboard.sme.applicationSubmittedDescription"),
      })
    } catch (error: unknown) {
      console.error("Document upload sequence failed:", error)
      toast({
        variant: "destructive",
        title: t("dashboard.sme.uploadFailedTitle"),
        description: error instanceof Error ? error.message : t("dashboard.sme.uploadFailedDescription"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6 relative overflow-hidden">
      {/* Dynamic Industry Ambient Background Decoration */}
      <div className={cn("absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none -z-10 opacity-30 blur-3xl transition-all duration-700", theme.glowColor)} />

      {/* Unified Responsive Hero Card */}
      <Card className={cn("overflow-hidden border bg-gradient-to-br shadow-xl backdrop-blur-sm relative", theme.borderColor)}>
        {/* Glow & SVG Background Pattern Overlay */}
        <div className={cn("absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl", theme.glowColor)} />
        <div className={cn("absolute inset-0 opacity-[0.05] pointer-events-none", theme.patternClass)} />

        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.4fr_0.6fr] items-stretch relative z-10">

          {/* Left Column: Project Profile Details */}
          <div className="space-y-6 flex flex-col justify-between">

            {/* Header / Eyebrow */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", theme.pulseColor)}></span>
                  <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", theme.pulseColor)}></span>
                </span>
                <span>{locale === 'vi' ? 'Tổng quan dự án SME' : 'SME Project Profile'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{project.legal_name}</h2>
                <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"} className="text-xs px-2.5 py-0.5 bg-black text-white rounded-full">
                  {project.status || t("dashboard.projectCard.status.draft")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {locale === 'vi' ? theme.taglineVi : theme.tagline}
              </p>
            </div>

            {/* Responsive Key Values Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-4 border-t border-border/40">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("dashboard.sme.industry")}</p>
                <p className={cn("text-base font-bold flex items-center gap-1.5", theme.accentColor)}>
                  <theme.icon className="h-4 w-4 shrink-0" />
                  {project.industry}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("dashboard.sme.taxId")}</p>
                <p className="text-base font-bold text-foreground">{project.tax_id}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("dashboard.sme.incorporationDate")}</p>
                <p className="text-base font-bold text-foreground">
                  {project.incorporation_date ? new Date(project.incorporation_date).toLocaleDateString(locale) : t("common.na")}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("dashboard.sme.daysActive")}</p>
                <p className="text-base font-bold text-foreground">{Math.max(0, daysActive)} days</p>
              </div>
            </div>

            {/* Address & Record Info in an elegant layout */}
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-border/40 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className={cn("h-4 w-4", theme.accentColor)} />
                  {t("dashboard.sme.registeredAddress")}
                </h4>
                {project.address ? (
                  <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
                    {(project.address as ProjectAddress | null | undefined)?.street}, {(project.address as ProjectAddress | null | undefined)?.city}
                    {(project.address as ProjectAddress | null | undefined)?.state ? `, ${(project.address as ProjectAddress | null | undefined)?.state}` : ''}
                    {`, ${(project.address as ProjectAddress | null | undefined)?.postal_code}`}, {(project.address as ProjectAddress | null | undefined)?.country}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">{t("dashboard.sme.noAddress")}</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className={cn("h-4 w-4", theme.accentColor)} />
                  {t("dashboard.sme.systemRecordDetails")}
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-mono truncate">ID: {project.id}</p>
                  <p>Created: {project.created_at ? new Date(project.created_at).toLocaleString(locale) : t("common.na")}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Industry Graphic Card */}
          <div className="hidden lg:flex relative h-full min-h-[220px] w-full rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-tr transition-all duration-500 hover:scale-[1.01] shadow-inner items-center justify-center">
            {/* Themed background & glow */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", theme.gradient)} />
            <div className={cn("absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-2xl opacity-40", theme.glowColor)} />
            <div className="absolute inset-0 bg-[radial-gradient(#8080800d_1px,transparent_1px)] [bg-size:12px_12px]" />

            {/* Themed Large Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className={cn("p-4 rounded-full bg-background/80 shadow-md ring-1 ring-border/50", theme.animationClass)}>
                <theme.icon className={cn("h-12 w-12", theme.accentColor)} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-base">{project.industry}</p>
                <p className="text-xs text-muted-foreground max-w-[180px] leading-relaxed">
                  {locale === 'vi' ? 'Danh mục ngành nghề đã xác thực' : 'Verified Industry Sector'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </Card>

      {/* Loan Application Upload Section */}
      {project.status === "DRAFT" && (
        <Card className={cn("p-6 border shadow-md transition-all duration-300", theme.borderColor)}>
          <div className="mb-4">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("dashboard.sme.submitLoanApplication")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("dashboard.sme.uploadNecessaryDocuments")}</p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-6 mt-6 max-w-4xl">
            <div className="space-y-4">
              {/* Document 1: Tax Filing */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center">
                  {t("dashboard.sme.taxFiling2025")} <span className="text-destructive ml-1">*</span>
                </label>
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border border-input focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    type="file"
                    id="taxFiling"
                    className="hidden"
                    onChange={(e) => handleFileChange("taxFiling", e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-background text-xs font-semibold hover:bg-accent"
                    onClick={() => document.getElementById("taxFiling")?.click()}
                  >
                    {t("dashboard.sme.chooseFile")}
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.taxFiling ? files.taxFiling.name : t("dashboard.sme.noFileChosen")}
                  </span>
                </div>
              </div>

              {/* Document 2: VAT Filing */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center">
                  {t("dashboard.sme.vatFiling")} <span className="text-destructive ml-1">*</span>
                </label>
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border border-input focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    type="file"
                    id="vatFiling"
                    className="hidden"
                    onChange={(e) => handleFileChange("vatFiling", e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-background text-xs font-semibold hover:bg-accent"
                    onClick={() => document.getElementById("vatFiling")?.click()}
                  >
                    {t("dashboard.sme.chooseFile")}
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.vatFiling ? files.vatFiling.name : t("dashboard.sme.noFileChosen")}
                  </span>
                </div>
              </div>

              {/* Document 3: Financial Statement */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {t("dashboard.sme.financialStatement")} <span className="text-muted-foreground text-xs font-normal ml-1">{t("dashboard.sme.optional")}</span>
                </label>
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border border-input focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    type="file"
                    id="financialStatement"
                    className="hidden"
                    onChange={(e) => handleFileChange("financialStatement", e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-background text-xs font-semibold hover:bg-accent"
                    onClick={() => document.getElementById("financialStatement")?.click()}
                  >
                    {t("dashboard.sme.chooseFile")}
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.financialStatement ? files.financialStatement.name : t("dashboard.sme.noFileChosen")}
                  </span>
                </div>
              </div>

              {/* Document 4: Business Plan */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {t("dashboard.sme.businessPlan")} <span className="text-muted-foreground text-xs font-normal ml-1">{t("dashboard.sme.optional")}</span>
                </label>
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border border-input focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    type="file"
                    id="businessPlan"
                    className="hidden"
                    onChange={(e) => handleFileChange("businessPlan", e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-background text-xs font-semibold hover:bg-accent"
                    onClick={() => document.getElementById("businessPlan")?.click()}
                  >
                    {t("dashboard.sme.chooseFile")}
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.businessPlan ? files.businessPlan.name : t("dashboard.sme.noFileChosen")}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className={cn("text-white gap-2 font-medium px-5 h-10 rounded-lg transition-all border shadow-xs duration-300",
                  isSubmitted ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500" : "bg-black hover:bg-black/90 dark:bg-white dark:text-black border-transparent"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("dashboard.sme.submittingApplication")}
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                    {t("dashboard.sme.applicationSubmitted")}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 animate-bounce duration-[2000ms]" />
                    {t("dashboard.sme.submitApplication")}
                  </>
                )}
              </Button>
            </div>

            {/* Required documents Alert Box at the bottom */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
              <FileText className="h-5 w-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="space-y-1.5 text-sm">
                <span className="font-semibold text-blue-900 dark:text-blue-100">{t("dashboard.sme.requiredDocuments")}</span>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t("dashboard.sme.taxFiling2025")}</li>
                  <li>{t("dashboard.sme.vatFiling")}</li>
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">{t("dashboard.sme.optionalDocuments")}</p>
              </div>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
