import type { Metadata } from "next";
import { KycClient } from "./kyc-client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.kycTitle"),
    description: t("seo.kycDescription"),
  };
}

export default function Page() {
  return <KycClient />;
}
