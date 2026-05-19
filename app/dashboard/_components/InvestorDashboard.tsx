import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar, ArrowRight, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const MOCK_INVESTMENTS = [
  {
    id: 1,
    name: "TechStart Solutions",
    investedDate: "12/1/2025",
    status: "Active",
    investment: "$10,000",
    revenueShare: "8.5% daily",
    dailyReturn: "$42",
    roi: "10.2%",
  },
  {
    id: 2,
    name: "Green Energy Co",
    investedDate: "11/15/2025",
    status: "Active",
    investment: "$25,000",
    revenueShare: "12% daily",
    dailyReturn: "$95",
    roi: "14.5%",
  }
]

export function InvestorDashboard() {
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-500" />
            <div className="text-3xl font-bold">$50,000</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Returns</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <div className="text-3xl font-bold">$25,770</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-500" />
            <div className="text-3xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      {/* Investment List */}
      <div className="space-y-4">
        {MOCK_INVESTMENTS.map((inv) => (
          <Card key={inv.id} className="p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {inv.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Invested {inv.investedDate}
                </p>
              </div>
              <Badge className="rounded-full px-3 py-1 font-medium bg-black text-white hover:bg-black/80">
                {inv.status}
              </Badge>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Investment</span>
                <span className="text-base font-semibold">{inv.investment}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Revenue Share</span>
                <span className="text-base font-semibold">{inv.revenueShare}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Daily Return</span>
                <span className="text-base font-semibold text-emerald-500">{inv.dailyReturn}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">ROI</span>
                <span className="text-base font-semibold">{inv.roi}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" className="flex-1 justify-center text-foreground hover:bg-muted font-medium">
                View Loan Details <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="secondary" className="px-6 bg-muted hover:bg-muted/80">
                <Tag className="h-4 w-4 mr-2" />
                Sell
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
