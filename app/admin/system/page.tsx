import type { Metadata } from "next";
import AdminSystemClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.systemSettings"),
  };
}

export default function AdminSystemPage() {
  return <AdminSystemClient />;
}
