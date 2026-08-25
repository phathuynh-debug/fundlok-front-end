import { ArrowRight, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/services/projects.service";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/lib/format-currency";
import { industryLabel } from "@/lib/industry-label";
import { cn } from "@/lib/utils";
import { getIndustryChrome } from "./sme-dashboard-config";
import { CONTROL_IDLE } from "@/lib/ui-tokens";

interface ProjectCardProps {
  project: Project;
  role?: "SME" | "INVESTOR";
  actionLabel?: string;
}

type ProjectAddress = {
  city?: string;
  country?: string;
};

export function ProjectCard({
  project,
  role = "SME",
  actionLabel,
}: ProjectCardProps) {
  const { locale, t } = useTranslations();

  // List tier: neutral surface, industry identity limited to the rail + pill.
  // See IndustryTier in ./sme-dashboard-config.
  const chrome = getIndustryChrome(project.industry, "list");
  const IndustryIcon = chrome.icon;

  const isActive = project.status === "ACTIVE";

  // Format dates safely (locale-aware: vi → DD/MM/YYYY, en → MM/DD/YYYY)
  const createdDate = project.created_at
    ? formatDate(project.created_at, locale)
    : t("common.unknown");

  const incorporationDate = project.incorporation_date
    ? formatDate(project.incorporation_date, locale)
    : t("common.unknown");

  // Deal terms for the investor view. The marketplace listing carries the loan
  // application (GET /projects/public), so the asking amount is real data.
  //
  // Duration and expected ROI are not available yet and render as "pending"
  // rather than a fabricated number: `loan_applications` has no term column,
  // and the rate comes from the grading engine, which is not wired into
  // POST /underwriting/score-runs yet. Both are tracked in
  // docs/specs/underwriting/grading-input-sources.md §3.3.
  const loanApplication = project.loan_application;
  const askingAmount =
    loanApplication?.requested_amount === undefined ||
    loanApplication?.requested_amount === null
      ? undefined
      : Number(loanApplication.requested_amount);
  const durationMonths = loanApplication?.duration_months ?? undefined;
  const expectedRoiPct = loanApplication?.interest_rate_pct ?? undefined;

  // Assuming address has city and country based on log
  const address = project.address as ProjectAddress | null | undefined;
  const location =
    address?.city && address?.country
      ? `${address.city}, ${address.country}`
      : t("common.locationUnavailable");

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 md:p-6 gap-0 transition-shadow hover:shadow-md",
        chrome.surface,
      )}
    >
      {/* Industry identity rail */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-0.5",
          chrome.rail,
        )}
      />

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {project.legal_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.projectCard.created", { date: createdDate })}
            </p>
          </div>
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {isActive
              ? t("dashboard.projectCard.status.active")
              : t("dashboard.projectCard.status.draft")}
          </Badge>
        </div>

        {/* Metrics row.
            FE-008: an investor scanning the marketplace needs the DEAL, not the
            company's paperwork — industry, asking amount, term, expected
            return. Tax ID / incorporation / location are compliance details and
            stay on the details page, where they are still one click away. An
            SME looking at its own project sees the paperwork instead: it is the
            record it just filed. */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {t("dashboard.projectCard.industry")}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "w-fit max-w-full gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold",
                chrome.badge,
              )}
            >
              <IndustryIcon className="shrink-0" />
              <span className="truncate">
                {industryLabel(project.industry, t)}
              </span>
            </Badge>
          </div>

          {role === "INVESTOR" ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.askingAmount")}
                </span>
                <span className="text-base font-semibold">
                  {askingAmount === undefined
                    ? t("dashboard.projectCard.pending")
                    : formatCurrency(askingAmount, locale)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.duration")}
                </span>
                <span className="text-base font-semibold">
                  {durationMonths === undefined
                    ? t("dashboard.projectCard.pending")
                    : t("dashboard.projectCard.months", {
                        count: durationMonths,
                      })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.expectedRoi")}
                </span>
                <span
                  className={cn(
                    "text-base font-semibold",
                    expectedRoiPct === undefined
                      ? undefined
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {expectedRoiPct === undefined
                    ? t("dashboard.projectCard.pendingGrading")
                    : `${expectedRoiPct.toFixed(1)}%`}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.taxId")}
                </span>
                <span className="text-base font-semibold">
                  {project.tax_id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.incorporation")}
                </span>
                <span className="text-base font-semibold">
                  {incorporationDate}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.projectCard.location")}
                </span>
                <span className="text-base font-semibold">{location}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button
            asChild
            variant="outline"
            className={cn(
              "group/details flex-1 w-full sm:w-auto justify-between",
              CONTROL_IDLE,
            )}
          >
            <Link href={`/dashboard/project-details?id=${project.id}`}>
              {t("dashboard.projectCard.viewDetails")}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/details:translate-x-0.5" />
            </Link>
          </Button>
          {role === "SME" ? (
            <Button
              variant="outline"
              className={cn("w-full sm:w-auto px-4", CONTROL_IDLE)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("dashboard.projectCard.edit")}
            </Button>
          ) : (
            <Button className="w-full sm:w-auto px-6">
              {actionLabel || t("dashboard.projectCard.invest")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
