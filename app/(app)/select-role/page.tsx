import type { Metadata } from "next";
import { SelectRoleClient } from "./select-role-client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.selectRoleTitle"),
    description: t("seo.selectRoleDescription"),
  };
}

export default function Page() {
  return <SelectRoleClient />;
}
