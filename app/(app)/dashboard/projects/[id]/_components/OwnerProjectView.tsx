"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/services/projects.service";
import { useTranslations } from "@/lib/i18n";
import { industryLabel } from "@/lib/industry-label";
import { enumLabel } from "@/lib/enum-labels";
import { pageTransitionProps, fadeInUpProps } from "@/lib/animations";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { getIndustryTheme } from "@/app/(app)/dashboard/_components/sme-dashboard-config";
import { LoanApplicationSection } from "@/app/(app)/dashboard/_components/loan-application/LoanApplicationSection";

// The SME's own project at /dashboard/projects/<id>, from GET /projects.
//
// Real figures only. The investor view of this page fills the score, the
// strengths and risks and the funding progress from sample data, and asks for
// an investment; none of that is the owner's business, and showing it would
// tell an SME things about their own company that are not true. What they get
// instead is their funding request as it stands: the upload wizard while it
// is a draft, then the review status, the approval summary (business score,
// reference rate, repayment) and the documents on file.
export function OwnerProjectView({ project }: { project: Project | undefined }) {
  const { t, locale } = useTranslations();

  return (
    <m.div
      {...pageTransitionProps}
      className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto"
    >
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn("gap-2 -ml-2", CONTROL_IDLE)}
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            {t("dashboard.projectDetails.backToDashboard")}
          </Link>
        </Button>
      </div>

      {!project ? (
        // Not one of theirs (or no longer there): say so rather than render
        // another company's page or a sample one.
        <p className="rounded-xl border bg-muted/20 p-6 text-sm text-muted-foreground">
          {t("dashboard.projectDetails.notYours")}
        </p>
      ) : (
        <>
          <m.div {...fadeInUpProps} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.legal_name}
              </h1>
              <Badge
                variant="outline"
                className="rounded-full px-3 py-0.5 text-xs font-semibold"
              >
                {enumLabel(t, "projectStatus", project.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {industryLabel(project.industry, t) || "—"}
            </p>
            {project.loan_application?.purpose && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {project.loan_application.purpose}
              </p>
            )}
          </m.div>

          {project.loan_application ? (
            <LoanApplicationSection
              project={project}
              locale={locale}
              theme={getIndustryTheme(project.industry)}
              t={t}
            />
          ) : (
            <p className="rounded-xl border bg-muted/20 p-6 text-sm text-muted-foreground">
              {t("dashboard.projectDetails.noApplication")}
            </p>
          )}
        </>
      )}
    </m.div>
  );
}
