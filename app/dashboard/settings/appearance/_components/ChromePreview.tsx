"use client";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";

/**
 * A live sample of the chrome the accent and radius controls affect.
 *
 * Unlike ThemePreview, this one uses the REAL tokens — that is the point. It
 * exists because the radius change is easy to miss on a page made of large
 * cards: a button, an input and a pill next to each other make the corner
 * change obvious, and they recolour with the accent at the same time.
 */
export function ChromePreview() {
  const { t } = useTranslations();

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("dashboard.settings.appearance.preview.label")}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" className="gap-1.5">
          {t("dashboard.settings.appearance.preview.action")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline">
          {t("common.cancel")}
        </Button>
        <Badge className="bg-primary text-primary-foreground">
          {t("dashboard.settings.appearance.preview.badge")}
        </Badge>
        <Input
          aria-label={t("dashboard.settings.appearance.preview.fieldLabel")}
          placeholder={t("dashboard.settings.appearance.preview.fieldLabel")}
          className="h-9 w-full sm:w-52"
        />
      </div>
    </div>
  );
}
