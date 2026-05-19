"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { usePublicProjects } from "@/hooks/use-projects"
import { useRequireAuth } from "@/hooks/use-authentication"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { InvestmentKpis } from "./_components/InvestmentKpis"
import { ReturnProgress } from "./_components/ReturnProgress"
import { PaymentHistory } from "./_components/PaymentHistory"

// Simple interface for payments
interface PaymentRecord {
  date: string
  amount: number
}

export default function ProjectDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = searchParams.get("id")

  const { user, isLoading: isAuthLoading } = useRequireAuth()
  
  // We load public projects to find the matching one
  const { data: projects = [], isLoading: isProjectsLoading } = usePublicProjects(
    !isAuthLoading && user?.role === "INVESTOR"
  )

  const project = projects.find((p) => p.id === projectId)

  if (isAuthLoading || isProjectsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading project details...
          </span>
        </div>
      </div>
    )
  }

  // Fallback details if no project found to make it look nice anyway
  const displayName = project?.legal_name || "TechStart Solutions"
  const displayStatus = project?.status || "ACTIVE"
  const displayIndustry = project?.industry || "Software & Technology"

  // Mock payment history generator (last 7 days)
  const generateMockPayments = (): PaymentRecord[] => {
    const payments: PaymentRecord[] = []
    const baseDate = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() - i)
      payments.push({
        date: d.toLocaleDateString(),
        amount: 42,
      })
    }
    return payments
  }

  const mockPayments = generateMockPayments()

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
            <Badge 
              variant={displayStatus === "ACTIVE" ? "default" : "secondary"}
              className="bg-black text-white hover:bg-black/80 rounded-full px-3"
            >
              {displayStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Investment Performance Details &bull; {displayIndustry}
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <InvestmentKpis />

      {/* Return Progress Card */}
      <ReturnProgress />

      {/* Payment History Card */}
      <PaymentHistory payments={mockPayments} />
    </div>
  )
}
