import type { Metadata } from "next";
import AdminRatesClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.rates"),
  };
}

export default function AdminRatesPage() {
  return <AdminRatesClient />;
}
