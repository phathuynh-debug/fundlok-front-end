import type { Metadata } from "next";

import en from "@/lib/i18n/en.json";
import vi from "@/lib/i18n/vi.json";
import { FAQ_CATEGORIES, faqQuestionNumbers } from "@/lib/faq-questions";
import {
  getSeoStrings,
  localeAlternates,
  OG_LOCALE,
  resolveSeoLocale,
  type SeoLocale,
} from "@/lib/seo";
import FaqClient from "./faq-client";

/**
 * Metadata and rich-result data are built from the SAME dictionary the page
 * renders, so the snippet can never describe content in another language.
 *
 * This used to read `en` at module scope. That was correct while English was
 * the default; now that a crawler with no cookie gets Vietnamese, the questions
 * Google was offered as rich results were in a language the page did not show.
 */
const dictionaries = { en, vi } as const;

function qaPairsFor(locale: SeoLocale) {
  const faq = dictionaries[locale].faqPage;
  return FAQ_CATEGORIES.flatMap((key) => {
    const category = faq[key];
    return faqQuestionNumbers(key).map((n) => ({
      question: category[`q${n}` as keyof typeof category] as string,
      answer: category[`a${n}` as keyof typeof category] as string,
    }));
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, seo } = await getSeoStrings();
  const title = seo.faqTitle;
  const description = seo.faqDescription;

  return {
    title,
    description,
    keywords: [
      "FundLok FAQ",
      "FundLok questions",
      "FundLok support",
      "MSME financing FAQ",
      "SME financing FAQ",
      "private credit FAQ",
      "invest in SMEs",
      "contact FundLok",
      // Search engines see every question verbatim, in the page's language.
      ...qaPairsFor(locale).map(({ question }) => question),
    ],
    alternates: localeAlternates("/faq", locale),
    openGraph: {
      title,
      description,
      url: localeAlternates("/faq", locale).canonical,
      siteName: "FundLok",
      type: "website",
      locale: OG_LOCALE[locale],
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function FaqPage() {
  const locale = await resolveSeoLocale();

  // FAQPage rich-result structured data: every question with its full answer.
  // This is what makes Q&As eligible to appear directly in search results.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qaPairsFor(locale).map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqClient />
    </>
  );
}
