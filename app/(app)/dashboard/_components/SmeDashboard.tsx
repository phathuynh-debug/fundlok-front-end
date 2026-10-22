"use client";

import { useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  CheckCircle2,
  Rocket,
  ArrowRight,
  Target,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/services/projects.service";
import { useTranslations } from "@/lib/i18n";
import { industryLabel } from "@/lib/industry-label";
import { cn } from "@/lib/utils";
import { getIndustryTheme } from "./sme-dashboard-config";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import { useVerificationGate } from "@/hooks/use-verification-gate";
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
  const { needsVerification, openVerification } = useVerificationGate();
  const [copied, setCopied] = useState(false);

  // No project yet → invite the SME to apply. "Apply for funding" links to
  // /project-application, which the proxy KYB-gates: an unverified SME is sent
  // through /kyc first, then returned to the application form.
  if (!project) {
    return (
      <m.div
        initial={{ y: 15 }}
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
          <Button asChild size="lg" className="gap-2" data-tour="sme-apply">
            <Link
              href="/project-application"
              onClick={(event) => {
                // An SME without an approved KYB verifies in a new tab; this
                // one continues to the application once it's approved.
                if (needsVerification("/project-application")) {
                  event.preventDefault();
                  openVerification("/project-application");
                }
              }}
            >
              {t("dashboard.sme.emptyCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </m.div>
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
    <m.div
      initial={{ y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6 relative"
    >
      {/* Unified Responsive Hero Card */}
      <Card
        className={cn(
          "overflow-hidden border bg-card shadow-sm relative transition-all duration-300",
          theme.borderColor,
        )}
      >
        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.35fr_0.65fr] items-stretch relative z-10">
          {/* Left Column: Project Profile Details */}
          <div className="min-w-0 space-y-6 flex flex-col justify-between">
            {/* Header / Eyebrow */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", theme.pulseColor)}
                  />
                  <span>
                    {locale === "vi"
                      ? "Tổng quan dự án SME"
                      : "SME Project Profile"}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {project.legal_name}
                </h2>
                <Badge
                  variant={
                    project.status === "ACTIVE" ? "default" : "secondary"
                  }
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-semibold",
                    project.status === "ACTIVE"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {enumLabel(t, "projectStatus", project.status || "DRAFT")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {locale === "vi" ? theme.taglineVi : theme.tagline}
              </p>
            </div>

            {/* Structured Key Values Metrics Grid */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 pt-2">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="stat-label">{t("dashboard.sme.industry")}</p>
                <p
                  className={cn(
                    "text-sm font-semibold flex items-center gap-1.5",
                    theme.accentColor,
                  )}
                >
                  <theme.icon className="h-4 w-4 shrink-0" />
                  {industryLabel(project.industry, t)}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="stat-label">{t("dashboard.sme.taxId")}</p>
                <p className="text-sm font-semibold font-mono text-foreground">
                  {project.tax_id}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="stat-label">
                  {t("dashboard.sme.incorporationDate")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {project.incorporation_date
                    ? formatDate(project.incorporation_date, locale)
                    : t("common.na")}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <p className="stat-label">{t("dashboard.sme.daysActive")}</p>
                <p className="text-sm font-semibold text-foreground">
                  {t("dashboard.sme.dayCount", {
                    count: Math.max(0, daysActive),
                  })}
                </p>
              </div>
            </div>

            {/* Address & Record Info in an elegant layout */}
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-border/40 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs">
                  <MapPin className={cn("h-3.5 w-3.5", theme.accentColor)} />
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
                <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs">
                  <CheckCircle2
                    className={cn("h-3.5 w-3.5", theme.accentColor)}
                  />
                  {t("dashboard.sme.systemRecordDetails")}
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[11px] text-muted-foreground">
                      ID:
                    </span>
                    <span className="truncate max-w-[200px]">{project.id}</span>
                  </div>
                  <p>
                    {t("dashboard.sme.createdAt")}:{" "}
                    {project.created_at
                      ? formatDateTime(project.created_at, locale)
                      : t("common.na")}
                  </p>
                </div>
              </div>
            </div>

            {/* Loan purpose */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1 text-sm">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs">
                <Target className={cn("h-3.5 w-3.5", theme.accentColor)} />
                {t("dashboard.sme.loanPurpose")}
              </h4>
              <p
                className={cn(
                  "text-xs leading-relaxed",
                  project.loan_application?.purpose
                    ? "text-muted-foreground"
                    : "text-muted-foreground/70 italic",
                )}
              >
                {project.loan_application?.purpose?.trim() ||
                  t("dashboard.sme.noLoanPurpose")}
              </p>
            </div>
          </div>

          {/* Right Column: Project Quick Snapshot Card */}
          <div className="hidden lg:flex flex-col justify-between h-full rounded-2xl border border-border/60 bg-muted/20 p-5 shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl bg-background shadow-xs ring-1 ring-border/50",
                      theme.accentColor,
                    )}
                  >
                    <theme.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {industryLabel(project.industry, t)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "vi"
                        ? "Ngành nghề kinh doanh"
                        : "Business Sector"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] font-semibold",
                    project.status === "ACTIVE"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-border bg-muted/60 text-muted-foreground",
                  )}
                >
                  {enumLabel(t, "projectStatus", project.status || "DRAFT")}
                </Badge>
              </div>

              {/* Quick ID Copy */}
              <div className="rounded-xl border border-border/50 bg-background/80 p-3 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {locale === "vi"
                      ? "Mã định danh dự án"
                      : "Project Reference ID"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(project.id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    title={locale === "vi" ? "Sao chép mã" : "Copy ID"}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {locale === "vi" ? "Đã chép" : "Copied"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>{locale === "vi" ? "Sao chép" : "Copy"}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-foreground truncate select-all">
                  {project.id}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs font-semibold"
              >
                <Link href={`/dashboard/project-details?id=${project.id}`}>
                  <span>
                    {locale === "vi"
                      ? "Xem chi tiết dự án"
                      : "View Project Details"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
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
            companyName={project.legal_name}
            locale={locale}
            theme={theme}
            t={t}
          />
        ))}
    </m.div>
  );
}
