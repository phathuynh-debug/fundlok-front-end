import type { Metadata } from "next";
import WhyUsClient from "./why-us-client";

export const metadata: Metadata = {
  title: "Why Us | FundLok",
  description:
    "Discover FundLok's vision. We believe every SME has a unique story. Learn about investor safety with stable daily income, flexible revenue share terms for SMEs, and automatic document processing.",
  keywords: [
    "FundLok vision",
    "SME story",
    "flexible capital solutions",
    "investor safety",
    "stable daily income",
    "progressive repayment",
    "revenue share lending",
    "automated credit risk scoring",
    "verified data financing",
  ],
  openGraph: {
    title: "Why Us | FundLok - Flexible Capital Platform",
    description:
      "Discover FundLok's vision. We believe every SME has a unique story. Learn about investor safety with stable daily income, flexible revenue share terms for SMEs, and automatic document processing.",
    type: "website",
    siteName: "FundLok",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Us | FundLok - Flexible Capital Platform",
    description:
      "Discover FundLok's vision. We believe every SME has a unique story. Learn about investor safety with stable daily income, flexible revenue share terms for SMEs, and automatic document processing.",
  },
};

export default function WhyUsPage() {
  return <WhyUsClient />;
}
