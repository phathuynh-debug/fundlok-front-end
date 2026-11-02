import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";
import { SepayCallbackClient } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return { title: t("dashboard.settings.profile.sepay.callbackTitle") };
}

// SePay sends the browser here after the user approves (or declines) access.
// The URL must match SEPAY_REDIRECT_URI on the backend and the redirect URL
// registered with SePay.
export default function SepayCallbackPage() {
  return <SepayCallbackClient />;
}
