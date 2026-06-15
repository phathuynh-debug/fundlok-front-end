import type { Metadata } from "next";
import ContactClient from "./contact-client";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact FundLok | Partnerships, Support, and Inquiries",
  description:
    "Reach out to FundLok for partnerships, support, and general inquiries.",
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
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact FundLok | Partnerships, Support, and Inquiries",
    description:
      "Reach out to FundLok for partnerships, support, and general inquiries.",
    url: "/contact",
    siteName: "FundLok",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact FundLok | Partnerships, Support, and Inquiries",
    description:
      "Reach out to FundLok for partnerships, support, and general inquiries.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
