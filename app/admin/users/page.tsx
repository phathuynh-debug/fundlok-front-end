"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-authentication"
import { useTranslations } from "@/lib/i18n"
import { Loader2 } from "lucide-react"

export default function AdminUsersPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()
  const { t } = useTranslations()

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {t("admin.loading")}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("admin.usersPage.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.usersPage.subtitle")}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("admin.usersPage.comingSoon")}
      </div>
    </div>
  )
}
