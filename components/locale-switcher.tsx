"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n"

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useTranslations()

  return (
    <div className="inline-flex rounded-full border bg-background p-1 shadow-sm">
      <Button
        type="button"
        variant={locale === "en" ? "default" : "ghost"}
        size="sm"
        className="h-8 rounded-full px-3 text-xs"
        onClick={() => setLocale("en")}
      >
        {t("localeSwitcher.english")}
      </Button>
      <Button
        type="button"
        variant={locale === "vi" ? "default" : "ghost"}
        size="sm"
        className="h-8 rounded-full px-3 text-xs"
        onClick={() => setLocale("vi")}
      >
        {t("localeSwitcher.vietnamese")}
      </Button>
    </div>
  )
}