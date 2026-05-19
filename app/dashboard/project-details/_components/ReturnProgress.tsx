import { Card } from "@/components/ui/card"

export function ReturnProgress() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Return Progress</h3>
        <p className="text-sm text-muted-foreground">Track your investment returns over time</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>Progress</span>
            <span>29.0%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-slate-900" style={{ width: "29%" }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground mb-1">ROI</p>
            <p className="text-xl font-bold">10.2%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Daily Return</p>
            <p className="text-xl font-bold">$42</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Revenue Share</p>
            <p className="text-xl font-bold">8.5%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Post-Principal Rate</p>
            <p className="text-xl font-bold">2%</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm text-muted-foreground mb-1">Min Bi-weekly</p>
            <p className="text-xl font-bold">$1,200</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
