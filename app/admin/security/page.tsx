import type { Metadata } from "next";
import AdminSecurityClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.securityTitle"),
    description: t("seo.securityDescription"),
  };
}

export default function AdminSecurityPage() {
  return <AdminSecurityClient />;
}
