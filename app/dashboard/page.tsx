"use client";

import { useRequireAuth } from "@/hooks/use-authentication";
import { useMyProjects } from "@/hooks/use-projects";
import { SmeDashboard } from "./_components/SmeDashboard";
import { InvestorDashboard } from "./_components/InvestorDashboard";
import { DashboardHeader } from "./_components/DashboardHeader";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const { t } = useTranslations();
  const shouldLoadMyProjects = !isLoading && user?.role === "SME";

  // SMEs with no project land here (not on /project-application) and see an
  // empty state that links to the KYB-gated application flow. No redirect.
  const { data: myProjects = [], isLoading: isMyProjectsLoading } =
    useMyProjects(shouldLoadMyProjects);

  if (isLoading || isMyProjectsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {t("common.loadingDashboard")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      {/* Render Role-Specific Dashboard */}
      {user?.role === "SME" ? (
        <SmeDashboard projects={myProjects} />
      ) : (
        <InvestorDashboard />
      )}
    </div>
  );
}
