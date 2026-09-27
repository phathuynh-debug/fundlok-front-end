import type { Metadata } from "next";

import { getSeoStrings, localeAlternates, OG_LOCALE } from "@/lib/seo";
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
    alternates: localeAlternates("/rate", locale),
    openGraph: {
      title,
      description,
      url: localeAlternates("/rate", locale).canonical,
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
