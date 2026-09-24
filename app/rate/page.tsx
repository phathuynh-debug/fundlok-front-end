import type { Metadata } from "next";
import RateClient from "./rate-client";

export const metadata: Metadata = {
  title: "Check Your Rate — Indicative SME Financing Rate",
  description:
    "Answer a few questions about your business and see the indicative rate range FundLok's grading engine returns. No documents, no account.",
  keywords: [
    "SME financing rate",
    "indicative rate",
    "business loan rate Vietnam",
    "revenue based financing",
    "working capital rate",
    "FundLok rate",
  ],
  alternates: {
    canonical: "/rate",
  },
  openGraph: {
    title: "Check Your Rate — Indicative SME Financing Rate",
    description:
      "Answer a few questions about your business and see the indicative rate range FundLok's grading engine returns.",
    url: "/rate",
    siteName: "FundLok",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Check Your Rate — Indicative SME Financing Rate",
    description:
      "Answer a few questions about your business and see the indicative rate range FundLok's grading engine returns.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RatePage() {
  return <RateClient />;
}
