import type { Metadata } from "next";
import InvestClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.investTitle"),
    description: t("seo.investDescription"),
  };
}

export default function InvestPage() {
  return <InvestClient />;
}
