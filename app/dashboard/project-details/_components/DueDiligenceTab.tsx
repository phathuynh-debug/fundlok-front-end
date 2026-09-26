import { Card } from "@/components/ui/card";
import { FileText, Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { formatDate } from "@/lib/format-date";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

export function DueDiligenceTab() {
  const { toast } = useToast();
  const { t, locale } = useTranslations();

  // Sample documents. Names are translated and dates formatted for the
  // active locale, so the list reads naturally in either language.
  const documents = [
    {
      name: t("investment.dueDiligence.sampleFiles.taxFiling"),
      date: formatDate(new Date(2026, 0, 15), locale),
    },
    {
      name: t("investment.dueDiligence.sampleFiles.vatFiling"),
      date: formatDate(new Date(2026, 0, 20), locale),
    },
    {
      name: t("investment.dueDiligence.sampleFiles.financialStatement"),
      date: formatDate(new Date(2026, 0, 25), locale),
    },
  ];

  const handleDownload = (filename: string) => {
    toast({
      title: t("investment.dueDiligence.downloadingFile"),
      description: t("investment.dueDiligence.startingDownload", { filename }),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {t("investment.dueDiligence.title")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("investment.dueDiligence.subtitle")}
          </p>
        </div>

        {/* Document List */}
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {doc.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(doc.name)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                  CONTROL_IDLE,
                )}
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t("investment.dueDiligence.download")}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Reminder Box */}
        <div className="flex gap-3 p-4 rounded-xl border bg-amber-50/30 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {t("investment.dueDiligence.reminderTitle")}
            </p>
            <p className="text-sm text-amber-700/90 dark:text-amber-300/90 leading-relaxed">
              {t("investment.dueDiligence.reminderText")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
