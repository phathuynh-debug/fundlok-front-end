import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.projectApplicationTitle"),
    description: t("seo.projectApplicationDescription"),
  };
}

export default function ProjectApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
