import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

export function InvestorDashboard() {
  const { t } = useTranslations();

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {t("dashboard.investor.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {t("dashboard.investor.subtitle")}
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.investor.totalInvested")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-500" />
            <div className="text-3xl font-bold">$0.00</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.investor.activeInvestments")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" />
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.investor.totalReturns")}
            </CardTitle>
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
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("dashboard.investor.noInvestmentsTitle")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t("dashboard.investor.noInvestmentsDescription")}
          </p>
          <Button asChild className="px-6">
            <Link href="/dashboard/projects">
              {t("dashboard.investor.browseProjects")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
