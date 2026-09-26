import type { Metadata } from "next";

import { getSeoStrings, OG_LOCALE } from "@/lib/seo";
import ContactClient from "./contact-client";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, seo } = await getSeoStrings();
  const title = seo.contactTitle;
  const description = seo.contactDescription;

  return {
    title,
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
    alternates: { canonical: "/contact" },
    openGraph: {
      title,
      description,
      url: "/contact",
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
