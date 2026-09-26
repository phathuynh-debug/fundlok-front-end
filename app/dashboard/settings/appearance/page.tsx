import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";
import { AppearanceClient } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.appearanceTitle"),
    description: t("seo.appearanceDescription"),
  };
}

export default function AppearancePage() {
  return <AppearanceClient />;
}
