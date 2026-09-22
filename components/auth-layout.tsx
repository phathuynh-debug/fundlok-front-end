"use client";

import Link from "next/link";
// Image handled by Logo component
import { motion } from "framer-motion";
import { Shield, Zap, Users, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslations } from "@/lib/i18n";
import Logo from "@/components/logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslations();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen flex"
    >
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative overflow-hidden">
        {/* Financial abstract background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15)_0%,transparent_40%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(to_bottom_right,transparent_40%,rgba(16,185,129,0.1)_100%)]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Large transparent watermark logo */}
        <div className="absolute -left-20 top-1/6 opacity-[0.04] pointer-events-none -rotate-6">
          <TrendingUp className="w-[900px] h-[800px] text-emerald-100" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Logo
                alt={t("common.brandName")}
                containerClassName="relative w-40 h-10"
              />
            </Link>
          </div>

          <div className="flex flex-col gap-8 max-w-lg">
            {/* Not an <h1>: this line is the same on every auth screen, so as
                a heading it made /login and /forgot-password share one — which
                tells a crawler the two pages are about the same thing. The
                page's own heading carries the H1 instead; this is brand copy
                and keeps its size through styling, not through its tag. */}
            <p className="text-4xl xl:text-5xl font-bold text-white leading-tight text-balance">
              {t("auth.hero.headline")}
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              {t("auth.hero.description")}
            </p>

            <div className="flex flex-col gap-4 pt-4">
              <Feature
                icon={<Shield className="h-5 w-5 text-white" />}
                title={t("auth.hero.securityTitle")}
                subtitle={t("auth.hero.securitySubtitle")}
              />
              <Feature
                icon={<Zap className="h-5 w-5 text-white" />}
                title={t("auth.hero.speedTitle")}
                subtitle={t("auth.hero.speedSubtitle")}
              />
              <Feature
                icon={<Users className="h-5 w-5 text-white" />}
                title={t("auth.hero.networkTitle")}
                subtitle={t("auth.hero.networkSubtitle")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <span>{t("auth.footer.copyright")}</span>
              <span className="text-slate-600" aria-hidden>
                •
              </span>
              <Link
                href="/terms"
                className="hover:text-slate-300 underline underline-offset-2 transition-colors"
              >
                {t("auth.footer.termsLink")}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <LocaleSwitcher tone="inverted" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-border bg-background/50 backdrop-blur-md">
          <Link
            href="/"
            className="flex items-center gap-2 group relative z-40"
          >
            <Logo alt={t("common.brandName")} />
          </Link>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Form slot */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Form Footer */}
        <footer className="flex items-center justify-center p-6 border-t border-border">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-3 flex-wrap">
            <span>
              {t("auth.footer.helpPrefix")}{" "}
              <Link
                href="/contact"
                className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
              >
                {t("auth.footer.supportLink")}
              </Link>
            </span>
            <span className="text-muted-foreground/60" aria-hidden>
              •
            </span>
            <Link
              href="/terms"
              className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
            >
              {t("auth.footer.termsLink")}
            </Link>
          </p>
        </footer>
      </div>
    </motion.div>
  );
}

function Feature({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
