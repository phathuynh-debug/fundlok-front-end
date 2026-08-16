"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle2, Rocket, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/services/projects.service";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getIndustryTheme } from "./sme-dashboard-config";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { LoanApplicationUpload } from "./loan-application/LoanApplicationUpload";
import { LoanApplicationStatus } from "./loan-application/LoanApplicationStatus";

type ProjectAddress = {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

interface SmeDashboardProps {
  projects: Project[];
}

export function SmeDashboard({ projects }: SmeDashboardProps) {
  const project = projects[0];
  const { locale, t } = useTranslations();

  // No project yet → invite the SME to apply. "Apply for funding" links to
  // /project-application, which the proxy KYB-gates: an unverified SME is sent
  // through /kyc first, then returned to the application form.
  if (!project) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1 p-4 md:p-8 pt-6"
      >
        <Card className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-2xl border border-dashed bg-card p-8 text-center md:p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Rocket className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t("dashboard.sme.emptyTitle")}
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("dashboard.sme.emptyDescription")}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href="/project-application">
              {t("dashboard.sme.emptyCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </motion.div>
    );
  }

  const theme = getIndustryTheme(project.industry);

  const createdDate = project.created_at
    ? new Date(project.created_at)
    : new Date();
  const daysActive = Math.floor(
    (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6 relative overflow-hidden"
    >
      {/* Dynamic Industry Ambient Background Decoration */}
      <div
        className={cn(
          "absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none -z-10 opacity-30 blur-3xl transition-all duration-700",
          theme.glowColor,
        )}
      />

      {/* Unified Responsive Hero Card */}
      <Card
        className={cn(
          "overflow-hidden border bg-gradient-to-br shadow-xl backdrop-blur-sm relative",
          theme.borderColor,
        )}
      >
        {/* Glow & SVG Background Pattern Overlay */}
        <div
          className={cn(
            "absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl",
            theme.glowColor,
          )}
        />
        <div
          className={cn(
            "absolute inset-0 opacity-[0.05] pointer-events-none",
            theme.patternClass,
          )}
        />

        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.4fr_0.6fr] items-stretch relative z-10">
          {/* Left Column: Project Profile Details */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* Header / Eyebrow */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      theme.pulseColor,
                    )}
                  ></span>
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-2.5 w-2.5",
                      theme.pulseColor,
                    )}
                  ></span>
                </span>
                <span>
                  {locale === "vi"
                    ? "Tổng quan dự án SME"
                    : "SME Project Profile"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {project.legal_name}
                </h2>
                <Badge
                  variant={
                    project.status === "ACTIVE" ? "default" : "secondary"
                  }
                  className="text-xs px-2.5 py-0.5 bg-black text-white rounded-full"
                >
                  {project.status || t("dashboard.projectCard.status.draft")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {locale === "vi" ? theme.taglineVi : theme.tagline}
              </p>
            </div>

            {/* Responsive Key Values Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-4 border-t border-border/40">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("dashboard.sme.industry")}
                </p>
                <p
                  className={cn(
                    "text-base font-bold flex items-center gap-1.5",
                    theme.accentColor,
                  )}
                >
                  <theme.icon className="h-4 w-4 shrink-0" />
                  {project.industry}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("dashboard.sme.taxId")}
                </p>
                <p className="text-base font-bold text-foreground">
                  {project.tax_id}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("dashboard.sme.incorporationDate")}
                </p>
                <p className="text-base font-bold text-foreground">
                  {project.incorporation_date
                    ? formatDate(project.incorporation_date, locale)
                    : t("common.na")}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("dashboard.sme.daysActive")}
                </p>
                <p className="text-base font-bold text-foreground">
                  {Math.max(0, daysActive)} days
                </p>
              </div>
            </div>

            {/* Address & Record Info in an elegant layout */}
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-border/40 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className={cn("h-4 w-4", theme.accentColor)} />
                  {t("dashboard.sme.registeredAddress")}
                </h4>
                {project.address ? (
                  <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
                    {
                      (project.address as ProjectAddress | null | undefined)
                        ?.street
                    }
                    ,{" "}
                    {
                      (project.address as ProjectAddress | null | undefined)
                        ?.city
                    }
                    {(project.address as ProjectAddress | null | undefined)
                      ?.state
                      ? `, ${(project.address as ProjectAddress | null | undefined)?.state}`
                      : ""}
                    {`, ${(project.address as ProjectAddress | null | undefined)?.postal_code}`}
                    ,{" "}
                    {
                      (project.address as ProjectAddress | null | undefined)
                        ?.country
                    }
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {t("dashboard.sme.noAddress")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className={cn("h-4 w-4", theme.accentColor)} />
                  {t("dashboard.sme.systemRecordDetails")}
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-mono truncate">ID: {project.id}</p>
                  <p>
                    Created:{" "}
                    {project.created_at
                      ? formatDateTime(project.created_at, locale)
                      : t("common.na")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Industry Graphic Card */}
          <div className="hidden lg:flex relative h-full min-h-[220px] w-full rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-tr transition-all duration-500 hover:scale-[1.01] shadow-inner items-center justify-center">
            {/* Themed background & glow */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-20",
                theme.gradient,
              )}
            />
            <div
              className={cn(
                "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-2xl opacity-40",
                theme.glowColor,
              )}
            />
            <div className="absolute inset-0 bg-[radial-gradient(#8080800d_1px,transparent_1px)] [bg-size:12px_12px]" />

            {/* Themed Large Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div
                className={cn(
                  "p-4 rounded-full bg-background/80 shadow-md ring-1 ring-border/50",
                  theme.animationClass,
                )}
              >
                <theme.icon className={cn("h-12 w-12", theme.accentColor)} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-base">
                  {project.industry}
                </p>
                <p className="text-xs text-muted-foreground max-w-[180px] leading-relaxed">
                  {locale === "vi"
                    ? "Danh mục ngành nghề đã xác thực"
                    : "Verified Industry Sector"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loan application section. A DRAFT application (created together with
          the project) shows the document upload wizard; once submitted it
          flips to a read-only "submitted — awaiting review" status panel. */}
      {project.loan_application &&
        (project.loan_application.status === "DRAFT" ? (
          <LoanApplicationUpload
            loanApplicationId={project.loan_application.id}
            locale={locale}
            theme={theme}
            t={t}
          />
        ) : (
          <LoanApplicationStatus
            loanApplication={project.loan_application}
            locale={locale}
            theme={theme}
            t={t}
          />
        ))}
    </motion.div>
  );
}
