import type { Metadata } from "next";
import AdminTransactionsClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.transactions"),
  };
}

export default function AdminTransactionsPage() {
  return <AdminTransactionsClient />;
}
