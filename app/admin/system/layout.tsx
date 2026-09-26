import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getServerTranslations } from "@/lib/i18n/server";

// The page is a client component and cannot export metadata, so this
// pass-through layout gives the browser tab a localized title.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return { title: t("admin.sidebar.systemSettings") };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
