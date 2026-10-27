"use client";

import type { Project } from "@/services/projects.service";
import type { IndustryTheme } from "../sme-dashboard-config";
import { LoanApplicationUpload } from "./LoanApplicationUpload";
import { LoanApplicationStatus } from "./LoanApplicationStatus";

/**
 * The SME's own funding request. A DRAFT application (created together with
 * the project) shows the document upload wizard; once submitted it flips to a
 * read-only status panel: review progress, the approval summary, the
 * documents on file. Shared by the SME dashboard and the owner's view of
 * /dashboard/projects/<id>, so the two never show the same request differently.
 */
export function LoanApplicationSection({
  project,
  locale,
  theme,
  t,
}: {
  project: Project;
  locale: string;
  theme: IndustryTheme;
  t: (key: string) => string;
}) {
  if (!project.loan_application) return null;
  return project.loan_application.status === "DRAFT" ? (
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
  );
}
