import type { Metadata } from "next";
import TransactionsClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.transactionsTitle"),
    description: t("seo.transactionsDescription"),
  };
}

export default function TransactionsPage() {
  return <TransactionsClient />;
}
