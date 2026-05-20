import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"

export function RiskAssessmentTab() {
  const strengths = [
    "Strong recurring revenue model with 95% customer retention",
    "Consistent month-over-month growth of 15%",
    "Experienced management team with previous exits",
    "Complete financial documentation and transparency",
    "Low customer acquisition cost relative to lifetime value",
  ]

  const risks = [
    "Limited market presence outside primary region",
    "Dependence on key clients for 40% of revenue",
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Risk Overview Header */}
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">FundLok Risk Assessment</h3>
            <p className="text-sm text-muted-foreground">
              Our analysis leading to the A+ grade and 10.2% expected ROI
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-muted/40 rounded-xl border font-semibold text-lg">
            Grade A+
          </div>
        </div>

        {/* Strengths & Risks Grid */}
        <div className="grid md:grid-cols-2 gap-8 pt-6">
          {/* Strengths */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              <span>Strengths</span>
            </div>
            <ul className="space-y-3">
              {strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-semibold">
              <AlertTriangle className="h-5 w-5" />
              <span>Risks & Concerns</span>
            </div>
            <ul className="space-y-3">
              {risks.map((r, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Revenue Share Terms Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Revenue Share Terms</h3>
        
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Primary Rate */}
          <div className="p-5 rounded-2xl border bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30 flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-xs font-semibold text-blue-600/80 dark:text-blue-400 tracking-wider uppercase">
                Primary Rate
              </p>
              <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                8.5%
              </p>
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
              Until principal paid
            </p>
          </div>

          {/* Card 2: Post-Principal Rate */}
          <div className="p-5 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400 tracking-wider uppercase">
                Post-Principal Rate
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                2%
              </p>
            </div>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2">
              After principal paid
            </p>
          </div>

          {/* Card 3: Minimum Bi-weekly */}
          <div className="p-5 rounded-2xl border bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30 flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-xs font-semibold text-purple-600/80 dark:text-purple-400 tracking-wider uppercase">
                Minimum Bi-weekly
              </p>
              <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                $1,200
              </p>
            </div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2">
              Every 2 weeks
            </p>
          </div>
        </div>

        {/* How it works info box */}
        <div className="flex gap-3 p-4 rounded-xl border bg-sky-50/30 dark:bg-sky-950/10 border-sky-100 dark:border-sky-900/30">
          <Info className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />
          <p className="text-sm text-sky-700/90 dark:text-sky-300/90 leading-relaxed">
            <span className="font-semibold">How it works:</span> The SME shares 8.5% of their daily revenue until the principal is repaid. After that, the rate drops to 2%. A minimum payment of $1,200 is required every 2 weeks to ensure consistent returns.
          </p>
        </div>
      </div>
    </div>
  )
}
