import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";
import { ProfileClient } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.profileTitle"),
    description: t("seo.profileDescription"),
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
