"use client"

import { RegistrationForm } from "@/components/registration-form"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { useTranslations } from "@/lib/i18n"

export function RegisterClient() {
  const { t } = useTranslations()

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg border border-border">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("common.createAnAccount")}</h1>
          <p className="text-muted-foreground">{t("auth.hero.description")}</p>
        </div>

        {/* Main registration logic component */}
        <RegistrationForm />
      </div>
    </div>
  )
}
