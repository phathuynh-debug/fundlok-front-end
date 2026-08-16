import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { getDictionary, useTranslations } from "@/lib/i18n";
import { InvestmentTab } from "./InvestmentTab";

export function RiskAssessmentTab() {
  const { locale, t } = useTranslations();
  const dictionary = getDictionary(locale);
  const strengths = dictionary.investment.risk.strengthItems;
  const risks = dictionary.investment.risk.riskItems;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Risk Overview Header */}
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">
              {t("investment.risk.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("investment.risk.subtitle")}
            </p>
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
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
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
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Investment Tab content embedded directly below Risk Assessment */}
      <InvestmentTab />
    </div>
  );
}
