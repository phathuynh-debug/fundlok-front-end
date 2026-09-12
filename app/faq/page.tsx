import type { Metadata } from "next";
import en from "@/lib/i18n/en.json";
import { FAQ_CATEGORIES, faqQuestionNumbers } from "@/lib/faq-questions";
import FaqClient from "./faq-client";

// Everything below is derived from the same dictionary the page renders,
// so metadata and structured data never drift from the visible content.
const faq = en.faqPage;

const qaPairs = FAQ_CATEGORIES.flatMap((key) => {
  const category = faq[key];
  return faqQuestionNumbers(key).map((n) => ({
    question: category[`q${n}` as keyof typeof category] as string,
    answer: category[`a${n}` as keyof typeof category] as string,
  }));
});

// Search engines see every question verbatim in the keywords list.
const questionKeywords = qaPairs.map(({ question }) => question);

const description =
  "Answers to the most common questions about FundLok: what FundLok is, " +
  "how it differs from a traditional loan, who can apply for MSME funding, " +
  "how businesses are assessed and repay, who can invest, and how investor " +
  "funds are protected, tracked, and repaid.";

const title = "FundLok FAQ | Frequently Asked Questions";

export const metadata: Metadata = {
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
    ...questionKeywords,
  ],
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title,
    description,
    url: "/faq",
    siteName: "FundLok",
    type: "website",
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

// FAQPage rich-result structured data: every question with its full answer.
// This is what makes Q&As eligible to appear directly in search results.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: qaPairs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function FaqPage() {
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
