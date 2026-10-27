import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";
import ProjectDetailsClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.projectDetailsTitle"),
    description: t("seo.projectDetailsDescription"),
  };
}

// One project, at /dashboard/projects/<id>. It used to live at
// /dashboard/project-details?id=<id>, which now redirects here.
export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailsClient projectId={id} />;
}
