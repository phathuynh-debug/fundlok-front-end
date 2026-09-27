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

export default async function RatePage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string | string[] }>;
}) {
  // Read on the server so /rate?for=investor renders the investor tab in the
  // first HTML, with no flash of the SME form while the client catches up.
  const { for: audience } = await searchParams;
  return (
    <RateClient
      initialAudience={audience === "investor" ? "investor" : "sme"}
    />
  );
}
