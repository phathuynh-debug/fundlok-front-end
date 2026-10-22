import type { Metadata } from "next";
import AnalyticsClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.analyticsTitle"),
    description: t("seo.analyticsDescription"),
  };
}

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
