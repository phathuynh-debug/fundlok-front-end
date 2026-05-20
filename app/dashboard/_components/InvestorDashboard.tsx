import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Layers, Map, TrendingUp, DollarSign } from "lucide-react"
import type { Project } from "@/services/projects.service"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface InvestorDashboardProps {
  projects?: Project[] // Made optional as it's not strictly needed for empty investments list
}

export function InvestorDashboard({ projects = [] }: InvestorDashboardProps) {
  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-500" />
            <div className="text-3xl font-bold">$0.00</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Investments</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" />
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Returns</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-500" />
            <div className="text-3xl font-bold">$0.00</div>
          </CardContent>
        </Card>
      </div>

      {/* Investment List */}
      <div className="space-y-4">
        <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center p-6">
          <TrendingUp className="h-10 w-10 text-muted-foreground/60 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Investments Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You currently have no investment for now. Browse the available opportunities to start your investment journey.
          </p>
          <Button asChild className="px-6">
            <Link href="/dashboard/projects">
              Browse Investment Projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
