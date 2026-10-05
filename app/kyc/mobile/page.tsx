import { Suspense } from "react";
import type { Metadata } from "next";
import { MobileKycClient } from "./mobile-kyc-client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.kycMobileTitle"),
    description: t("seo.kycMobileDescription"),
  };
}

// The client reads the handoff token from the query string, which requires a
// Suspense boundary around useSearchParams in the App Router.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <MobileKycClient />
    </Suspense>
  );
}
