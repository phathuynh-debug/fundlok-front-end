import type { Metadata } from "next";

import { getSeoStrings, OG_LOCALE } from "@/lib/seo";
import RateClient from "./rate-client";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, seo } = await getSeoStrings();
  const title = seo.rateTitle;
  const description = seo.rateDescription;

  return {
    title,
    description,
    keywords: [
      "SME financing rate",
      "indicative rate",
      "business loan rate Vietnam",
      "revenue based financing",
      "working capital rate",
      "FundLok rate",
    ],
    alternates: { canonical: "/rate" },
    openGraph: {
      title,
      description,
      url: "/rate",
      siteName: "FundLok",
      type: "website",
      locale: OG_LOCALE[locale],
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export default function RatePage() {
  return <RateClient />;
}
