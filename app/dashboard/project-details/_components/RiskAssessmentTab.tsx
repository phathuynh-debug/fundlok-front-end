import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { getDictionary, useTranslations } from "@/lib/i18n"

export function RiskAssessmentTab() {
  const { locale, t } = useTranslations()
  const dictionary = getDictionary(locale)
  const strengths = dictionary.investment.risk.strengthItems
  const risks = dictionary.investment.risk.riskItems

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Risk Overview Header */}
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">{t("investment.risk.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("investment.risk.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-muted/40 rounded-xl border font-semibold text-lg">
            {t("dashboard.projectDetails.grade")}
          </div>
        </div>

        {/* Strengths & Risks Grid */}
        <div className="grid md:grid-cols-2 gap-8 pt-6">
          {/* Strengths */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              <span>{t("investment.risk.strengths")}</span>
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
              <span>{t("investment.risk.risks")}</span>
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
        <h3 className="text-lg font-semibold text-foreground">{t("investment.risk.revenueShareTerms")}</h3>
        
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Primary Rate */}
          <div className="p-5 rounded-2xl border bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30 flex flex-col justify-between min-h-27.5">
            <div>
              <p className="text-xs font-semibold text-blue-600/80 dark:text-blue-400 tracking-wider uppercase">
                {t("investment.risk.primaryRate")}
              </p>
              <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                8.5%
              </p>
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">{t("investment.risk.untilPrincipal")}</p>
          </div>

          {/* Card 2: Post-Principal Rate */}
          <div className="p-5 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between min-h-27.5">
            <div>
              <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400 tracking-wider uppercase">
                {t("investment.risk.postPrincipalRate")}
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                2%
              </p>
            </div>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2">{t("investment.risk.afterPrincipal")}</p>
          </div>

          {/* Card 3: Minimum Bi-weekly */}
          <div className="p-5 rounded-2xl border bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30 flex flex-col justify-between min-h-27.5">
            <div>
              <p className="text-xs font-semibold text-purple-600/80 dark:text-purple-400 tracking-wider uppercase">
                {t("investment.risk.minimumBiweekly")}
              </p>
              <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                $1,200
              </p>
            </div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2">{t("investment.risk.everyTwoWeeks")}</p>
          </div>
        </div>

        {/* How it works info box */}
        <div className="flex gap-3 p-4 rounded-xl border bg-sky-50/30 dark:bg-sky-950/10 border-sky-100 dark:border-sky-900/30">
          <Info className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />
          <p className="text-sm text-sky-700/90 dark:text-sky-300/90 leading-relaxed">
            <span className="font-semibold">{t("investment.risk.howItWorksTitle")}</span> {t("investment.risk.howItWorks")}
          </p>
        </div>
      </div>
    </div>
  )
}
