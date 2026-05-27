"use client";

import { useLogout, useRequireAuth } from "@/hooks/use-authentication";
import { LogOut, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslations } from "@/lib/i18n";
import Logo from "@/components/logo";

export function DashboardHeader() {
  const { user, isLoading } = useRequireAuth();
  const { mutate: logout } = useLogout();
  const router = useRouter();
  const { t } = useTranslations();

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("dashboard.header.loading")}
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight">
            <Logo alt={t("common.brandName")} />
          </div>
          <span className="text-sm font-medium text-muted-foreground ml-2">
            (
            {user?.role === "SME"
              ? t("dashboard.header.portal.sme")
              : t("dashboard.header.portal.investor")}
            )
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <ThemeToggle />

          <div className="hidden md:flex items-center gap-4 mr-4 text-sm font-medium">
            <span className="text-muted-foreground">
              {t("dashboard.header.welcomeBack", {
                name: user?.full_name || t("common.guest"),
              })}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <Home className="h-4 w-4" />
            {t("dashboard.header.home")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t("dashboard.header.logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
