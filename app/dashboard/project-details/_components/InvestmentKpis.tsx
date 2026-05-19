import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export function InvestmentKpis() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">Investment Amount</p>
        <div className="flex items-baseline gap-1 text-3xl font-bold">
          <span className="text-blue-500">$</span>
          <span>10,000</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Invested on 12/1/2025</p>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">Current Return</p>
        <div className="flex items-baseline gap-1 text-3xl font-bold text-emerald-500">
          <TrendingUp className="h-6 w-6 mr-1 self-center" />
          <span>$3,200</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Expected: $11,020</p>
      </Card>
    </div>
  )
}
