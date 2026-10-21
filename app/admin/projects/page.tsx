import type { Metadata } from "next";
import AdminProjectsClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.projects"),
  };
}

export default function AdminProjectsPage() {
  return <AdminProjectsClient />;
}
