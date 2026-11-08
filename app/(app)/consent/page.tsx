import type { Metadata } from "next";
import { Suspense } from "react";

import { RouteLoading } from "@/components/route-loading";
import { getServerTranslations } from "@/lib/i18n/server";
import { ConsentClient } from "./consent-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return { title: t("auth.consent.title") };
}

// Contract 1, accepted by every SME and investor before they use the
// platform. The proxy sends them here (proxy.ts, consent gate).
export default function Page() {
  return (
    // useSearchParams (?next=) needs a Suspense boundary in the App Router.
    <Suspense fallback={<RouteLoading fullScreen />}>
      <ConsentClient />
    </Suspense>
  );
}
