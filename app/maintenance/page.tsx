"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMaintenance } from "@/hooks/use-admin"
import { useTranslations } from "@/lib/i18n"
import { Loader2, Wrench } from "lucide-react"
import Logo from "@/components/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export default function MaintenancePage() {
  const router = useRouter()
  const { t } = useTranslations()
  const { data, isLoading, isError } = useMaintenance()

  // If maintenance has been lifted, don't strand the user here.
  useEffect(() => {
    if (!isLoading && (isError || data?.enabled === false)) {
      router.replace("/")
    }
  }, [isLoading, isError, data?.enabled, router])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Top-right controls */}
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="w-32">
          <Logo alt={t("common.brandName")} containerClassName="relative w-32 h-10 overflow-hidden" />
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Wrench className="h-8 w-8 text-primary" />
        </div>

        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("maintenancePage.title")}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {data?.message?.trim() || t("maintenancePage.defaultMessage")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
