"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Compass } from "lucide-react"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslations } from "@/lib/i18n"

export default function NotFound() {
  const { t } = useTranslations()

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (matches auth layout) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03)_0%,transparent_40%)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">F</span>
              </div>
              <span className="text-2xl font-bold text-primary-foreground">FundLok</span>
            </Link>
          </div>

          <div className="flex flex-col gap-6 max-w-lg">
            <div className="text-8xl font-bold text-primary-foreground/10 select-none leading-none">
              404
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight text-balance">
              {t("notFound.headline")}
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed">
              {t("notFound.description")}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-primary-foreground/50">
            <span>{t("common.copyright")}</span>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LocaleSwitcher tone="inverted" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold">F</span>
            </div>
            <span className="text-xl font-bold text-foreground">FundLok</span>
          </Link>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md flex flex-col items-center text-center gap-8">
            {/* Icon */}
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
              <Compass className="h-10 w-10 text-muted-foreground" />
            </div>

            {/* Mobile 404 (hidden on desktop since left panel shows it) */}
            <div className="lg:hidden text-7xl font-bold text-foreground/10 select-none leading-none">
              404
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                {t("notFound.pageTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("notFound.body")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button asChild className="flex-1 h-11">
                <Link href="/">
                  {t("notFound.goHome")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 h-11">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.dashboard")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden lg:flex items-center justify-center p-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t("common.needHelp")} {" "}
            <Link
              href="#"
              className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
            >
              {t("common.contactSupport")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
