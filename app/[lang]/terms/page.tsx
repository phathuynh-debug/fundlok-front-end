import type { Metadata } from "next";
import { TermsClient } from "./terms-client";
import { SITE_URL } from "@/lib/site";
import { createServerTranslator } from "@/lib/i18n/server";
import {
  localeAlternates,
  OG_LOCALE,
  pageLocale,
  type LangParams,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: LangParams;
}): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = createServerTranslator(locale);
  // termsTitle carries the full rendered title including the brand suffix, so
  // `absolute` keeps the root template from appending a second "| FundLok".
  const title = t("seo.termsTitle");
  const description = t("seo.termsDescription");

  return {
    title: { absolute: title },
    description,
    keywords: [
      "FundLok terms",
      "FundLok terms of service",
      "điều khoản dịch vụ FundLok",
      "điều khoản và điều kiện",
      "chính sách bảo mật",
      "SME credit platform terms",
      "private credit terms Vietnam",
    ],
    alternates: localeAlternates("/terms", locale),
    openGraph: {
      title,
      description,
      url: localeAlternates("/terms", locale).canonical,
      siteName: "FundLok",
      type: "website",
      locale: OG_LOCALE[locale],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const termsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "FundLok Terms and Conditions of Service",
  description:
    "Terms and Conditions of Service and Personal Data Protection Policy governing the FundLok platform.",
  url: `${SITE_URL}/terms`,
  publisher: {
    "@type": "Organization",
    name: "FundLok",
    url: SITE_URL,
    email: "support@fundlok.com",
  },
};

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        id="terms-jsonld"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }}
      />
      <TermsClient />
    </>
  );
}
