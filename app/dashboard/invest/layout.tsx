import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getServerTranslations } from "@/lib/i18n/server";

// The invest page is a client component and cannot export metadata itself, so
// this pass-through layout gives its browser tab a localized title.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.investTitle"),
    description: t("seo.investDescription"),
  };
}

export default function InvestLayout({ children }: { children: ReactNode }) {
  return children;
}
