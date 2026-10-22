import type { Metadata } from "next";
import AdminEmailClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.email"),
  };
}

export default function AdminEmailPage() {
  return <AdminEmailClient />;
}
