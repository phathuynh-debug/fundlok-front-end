import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "FundLok FAQ | Frequently Asked Questions",
  description:
    "Find answers to common questions about FundLok, support, and partnerships.",
  keywords: [
    "FundLok FAQ",
    "FundLok questions",
    "FundLok support",
    "SME financing FAQ",
    "private credit FAQ",
    "contact FundLok",
    "partnership FAQ",
  ],
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FundLok FAQ | Frequently Asked Questions",
    description:
      "Find answers to common questions about FundLok, support, and partnerships.",
    url: "/faq",
    siteName: "FundLok",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FundLok FAQ | Frequently Asked Questions",
    description:
      "Find answers to common questions about FundLok, support, and partnerships.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I contact support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use the Contact page or email hello@fundlok.com.",
      },
    },
    {
      "@type": "Question",
      name: "What is FundLok?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FundLok is a marketplace for on-chain credit facilities designed to improve capital access for SMEs and provide investment opportunities.",
      },
    },
    {
      "@type": "Question",
      name: "How do I become a partner?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Reach out via the Contact page or email us directly and our partnerships team will follow up.",
      },
    },
  ],
};

export default function FaqPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-6">
            Frequently Asked Questions
          </h1>

          <section className="space-y-6">
            <div>
              <h3 className="font-bold">How do I contact support?</h3>
              <p className="text-sm text-muted-foreground">
                Use the Contact page or email hello@fundlok.com.
              </p>
            </div>

            <div>
              <h3 className="font-bold">What is FundLok?</h3>
              <p className="text-sm text-muted-foreground">
                FundLok is a marketplace for on-chain credit facilities designed
                to improve capital access for SMEs and provide investment
                opportunities.
              </p>
            </div>

            <div>
              <h3 className="font-bold">How do I become a partner?</h3>
              <p className="text-sm text-muted-foreground">
                Reach out via the Contact page or email us directly and our
                partnerships team will follow up.
              </p>
            </div>
          </section>

          <div className="mt-8">
            <Link href="/" className="text-emerald-600 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
