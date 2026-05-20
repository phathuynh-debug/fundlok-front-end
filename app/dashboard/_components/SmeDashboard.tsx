"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Calendar, Clock, Hash, CheckCircle2, Upload, FileText, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { filesService } from "@/services/files.service"
import type { Project } from "@/services/projects.service"

interface SmeDashboardProps {
  projects: Project[]
}

export function SmeDashboard({ projects }: SmeDashboardProps) {
  const project = projects[0]
  const { toast } = useToast()

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
        title: "Required Documents Missing",
        description: "Please upload both Tax Filing 2025 and VAT Filing documents.",
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
        title: "Application Submitted",
        description: "Your loan application and documents have been uploaded successfully.",
      })
    } catch (error: any) {
      console.error("Document upload sequence failed:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error?.message || "An error occurred while uploading your documents. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

      {/* Loan Application Upload Section */}
      {project.status === "DRAFT" && (
        <Card className="p-6 border-border/80 shadow-md">
          <div className="mb-4">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Submit Loan Application</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload the necessary documents to receive loan offers
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-6 mt-6 max-w-4xl">
            <div className="space-y-4">
              {/* Document 1: Tax Filing */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center">
                  Tax Filing 2025 <span className="text-destructive ml-1">*</span>
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
                    Choose File
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.taxFiling ? files.taxFiling.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {/* Document 2: VAT Filing */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center">
                  VAT Filing <span className="text-destructive ml-1">*</span>
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
                    Choose File
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.vatFiling ? files.vatFiling.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {/* Document 3: Financial Statement */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Financial Statement <span className="text-muted-foreground text-xs font-normal ml-1">(Optional)</span>
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
                    Choose File
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.financialStatement ? files.financialStatement.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {/* Document 4: Business Plan */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Business Plan <span className="text-muted-foreground text-xs font-normal ml-1">(Optional)</span>
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
                    Choose File
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {files.businessPlan ? files.businessPlan.name : "No file chosen"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting || isSubmitted} 
                className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black gap-2 font-medium px-5 h-10 rounded-lg transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Application Submitted
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>

            {/* Required documents Alert Box */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
              <FileText className="h-5 w-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="space-y-1.5 text-sm">
                <span className="font-semibold text-blue-900 dark:text-blue-100">Required Documents:</span>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tax Filing 2025</li>
                  <li>VAT Filing</li>
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
                  Optional documents may improve your loan offer.
                </p>
              </div>
            </div>
          </form>
        </Card>
      )}

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
