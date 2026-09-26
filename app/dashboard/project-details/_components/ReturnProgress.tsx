import { Card } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n";

export function ReturnProgress() {
  const { t } = useTranslations();

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          {t("investment.returnProgress.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("investment.returnProgress.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>{t("investment.returnProgress.progress")}</span>
            <span>29.0%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-slate-900" style={{ width: "29%" }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("investment.returnProgress.roi")}
            </p>
            <p className="text-xl font-bold">10.2%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("investment.returnProgress.dailyReturn")}
            </p>
            <p className="text-xl font-bold">$42</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("investment.returnProgress.revenueShare")}
            </p>
            <p className="text-xl font-bold">8.5%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("investment.returnProgress.minBiweekly")}
            </p>
            <p className="text-xl font-bold">$1,200</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
