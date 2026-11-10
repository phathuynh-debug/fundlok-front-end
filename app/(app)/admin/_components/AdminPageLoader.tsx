"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

/**
 * Shared loading state for the admin pages while the session resolves.
 *
 * Its own module, not an export of AdminDirectory: importing it from there
 * pulled the directory and its user and project preview sheets into every
 * admin page's bundle, the ones that never show a directory included.
 */
export function AdminPageLoader() {
  const { t } = useTranslations();
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {t("admin.loading")}
        </span>
      </div>
    </div>
  );
}
