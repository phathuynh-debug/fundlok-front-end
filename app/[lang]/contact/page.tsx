import type { Metadata } from "next";

import {
  localeAlternates,
  OG_LOCALE,
  pageLocale,
  seoStringsFor,
  type LangParams,
} from "@/lib/seo";
import ContactClient from "./contact-client";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: LangParams;
}): Promise<Metadata> {
  const { locale, seo } = seoStringsFor(await pageLocale(params));
  const title = seo.contactTitle;
  const description = seo.contactDescription;

  return {
    // absolute: contactTitle already carries the brand; the root template
    // would otherwise append a second "| FundLok".
    title: { absolute: title },
    description,
    keywords: [
      "FundLok contact",
      "FundLok support",
      "FundLok partnerships",
      "SME financing contact",
      "private credit platform",
      "contact FundLok",
      "funding inquiries",
      "business financing support",
    ],
    alternates: localeAlternates("/contact", locale),
    openGraph: {
      title,
      description,
      url: localeAlternates("/contact", locale).canonical,
      siteName: "FundLok",
      type: "website",
      locale: OG_LOCALE[locale],
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact FundLok",
  description:
    "Reach out to FundLok for partnerships, support, and general inquiries.",
  url: `${SITE_URL}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: "FundLok",
    email: "support@fundlok.com",
    url: SITE_URL,
  },
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" id="contact-jsonld">
        {JSON.stringify(contactJsonLd)}
      </script>
      <ContactClient />
    </>
  );
}
