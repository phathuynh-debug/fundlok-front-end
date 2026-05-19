import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Activity, Percent, Calendar } from "lucide-react"

export function SmeDashboard() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Loan</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your active loan and track repayment progress
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Original Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mt-2">$50,000</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Balance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mt-2">$11,500</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mt-2">8%</div>
            <p className="text-xs text-muted-foreground mt-1">
              of daily revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Days Active</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mt-2">256 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue-Based Financing Details */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Revenue-Based Financing Details</h3>
          <p className="text-sm text-muted-foreground">Terms and conditions of your revenue share agreement</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Primary Revenue Share</p>
            <p className="text-xl font-semibold mb-1">8%</p>
            <p className="text-xs text-muted-foreground">Until principal is repaid</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Post-Principal Rate</p>
            <p className="text-xl font-semibold mb-1">2%</p>
            <p className="text-xs text-muted-foreground">After principal is repaid</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Estimated Payback</p>
            <p className="text-xl font-semibold mb-1">10 months</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Start Date</p>
            <p className="text-xl font-semibold mb-1">6/1/2025</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Principal Paid</p>
            <p className="text-xl font-semibold text-emerald-600 mb-1">$38,500</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Revenue Share Paid</p>
            <p className="text-xl font-semibold mb-1">$1,240</p>
            <p className="text-xs text-muted-foreground">After principal paid</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Minimum Bi-weekly</p>
            <p className="text-xl font-semibold mb-1">$1,200</p>
            <p className="text-xs text-muted-foreground">Required every 2 weeks</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold">Principal Repayment Progress</h3>
        <p className="text-sm text-muted-foreground">Track your progress towards repaying the principal amount</p>
        <div className="mt-6 h-4 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: "77%" }}></div>
        </div>
        <div className="flex justify-between mt-2 text-sm font-medium">
          <span>77% Repaid</span>
          <span className="text-muted-foreground">$11,500 Remaining</span>
        </div>
      </Card>
    </div>
  )
}
