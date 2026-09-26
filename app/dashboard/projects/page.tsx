import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";
import ProjectsClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.projectsTitle"),
    description: t("seo.projectsDescription"),
  };
}

export default function ProjectsPage() {
  return <ProjectsClient />;
}
