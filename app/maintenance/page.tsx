import type { Metadata } from "next";
import MaintenanceClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("maintenancePage.title"),
  };
}

export default function MaintenancePage() {
  return <MaintenanceClient />;
}
