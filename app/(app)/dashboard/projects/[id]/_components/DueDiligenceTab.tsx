import { Card } from "@/components/ui/card";
import { FileText, ShieldCheck, AlertTriangle, Lock } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

// What the business filed, by document type, each reviewed by the FundLok team
// before the project was approved. Names only, never the files: they hold the
// company's tax, invoice and credit data, so investors see that they were
// checked, not their contents. The list is the backend's
// (verified_documents on GET /projects/public).
export function DueDiligenceTab({
  documentTypes,
}: {
  documentTypes: string[];
}) {
  const { t } = useTranslations();

  // A type the copy doesn't know yet still shows, under its raw key, rather
  // than silently dropping a document the team did review.
  const labelFor = (type: string) => {
    const label = t(`investment.dueDiligence.documentTypes.${type}`);
    return label.startsWith("investment.") ? type : label;
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

        {documentTypes.length === 0 ? (
          <p className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("investment.dueDiligence.noDocuments")}
          </p>
        ) : (
          <ul className="space-y-3">
            {documentTypes.map((type) => (
              <li
                key={type}
                className="flex flex-col gap-3 p-4 rounded-xl border bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <FileText className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {labelFor(type)}
                  </p>
                </div>
                <span className="inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  {t("investment.dueDiligence.verifiedBy")}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("investment.dueDiligence.filesPrivate")}
        </p>

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
