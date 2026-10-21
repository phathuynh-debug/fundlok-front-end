import type { Metadata } from "next";
import AdminUsersClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.users"),
  };
}

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
