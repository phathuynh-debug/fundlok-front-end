import type { Metadata } from "next";

import en from "@/lib/i18n/en.json";
import vi from "@/lib/i18n/vi.json";
import {
  localeAlternates,
  OG_LOCALE,
  pageLocale,
  seoStringsFor,
  type LangParams,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import RateClient from "./rate-client";

export async function generateMetadata({
  params,
}: {
  params: LangParams;
}): Promise<Metadata> {
  const { locale, seo } = seoStringsFor(await pageLocale(params));
  const title = seo.rateTitle;
  const description = seo.rateDescription;

  return {
    // absolute: rateTitle already carries the brand suffix; the root template
    // would otherwise append a second "| FundLok".
    title: { absolute: title },
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

export default async function RatePage({ params }: { params: LangParams }) {
  // Same strings the FAQ section at the bottom of the page renders, so the
  // rich-result data can never describe Q&As in a language the page does not
  // show (see the note on app/[lang]/faq/page.tsx).
  const locale = await pageLocale(params);
  const seo = (locale === "en" ? en : vi).seo;
  const rateFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}/rate`,
    mainEntity: ([1, 2, 3] as const).map((n) => ({
      "@type": "Question",
      name: seo[`rateFaqQ${n}`],
      acceptedAnswer: { "@type": "Answer", text: seo[`rateFaqA${n}`] },
    })),
  };
  return (
    <>
      <script type="application/ld+json" id="rate-faq-jsonld">
        {JSON.stringify(rateFaqSchema)}
      </script>
      <RateClient />
    </>
  );
}
