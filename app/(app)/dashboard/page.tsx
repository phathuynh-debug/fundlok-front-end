"use client";

import dynamic from "next/dynamic";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useMyProjects } from "@/hooks/use-projects";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

// One dashboard per role, each in its own chunk: a user only ever sees one,
// and the SME one carries the whole loan-application flow. Rendered on the
// server as before (the session user is known there), which also preloads
// the chunk of the one rendered.
const SmeDashboard = dynamic(
  () => import("./_components/SmeDashboard").then((mod) => mod.SmeDashboard),
  { loading: () => <DashboardLoader /> },
);
const InvestorDashboard = dynamic(
  () =>
    import("./_components/InvestorDashboard").then(
      (mod) => mod.InvestorDashboard,
    ),
  { loading: () => <DashboardLoader /> },
);

function DashboardLoader() {
  const { t } = useTranslations();
  return (
    <div className="h-64 w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {t("common.loadingDashboard")}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const shouldLoadMyProjects = !isLoading && user?.role === "SME";

  // SMEs with no project land here (not on /project-application) and see an
  // empty state that links to the KYB-gated application flow. No redirect.
  const { data: myProjects = [], isLoading: isMyProjectsLoading } =
    useMyProjects(shouldLoadMyProjects);

  if (isLoading || isMyProjectsLoading) {
    return <DashboardLoader />;
  }

  return user?.role === "SME" ? (
    <SmeDashboard projects={myProjects} />
  ) : (
    <InvestorDashboard />
  );
}
