import type { Metadata } from "next";
import { SuspendedClient } from "./suspended-client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.suspendedTitle"),
    // No reason to let this be indexed — it is a dead end reachable only by an
    // account the platform has shut out.
    robots: { index: false, follow: false },
  };
}

export default function Page() {
  return <SuspendedClient />;
}
