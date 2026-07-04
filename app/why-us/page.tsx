import type { Metadata } from "next";
import WhyUsClient from "./why-us-client";

export const metadata: Metadata = {
  title: "Why Us | FundLok - Vision, Recognitions & Achievements",
  description:
    "Discover FundLok's vision and award-winning track record. Recognized by the Australian Government (Sustainability in Action 2024), incubated by SIHUB, and a Top 10 project at the International Blockchain Olympiad 2023. Learn about investor safety, flexible revenue-share terms for SMEs, and automated document processing.",
  keywords: [
    "FundLok vision",
    "FundLok achievements",
    "FundLok awards",
    "FundLok recognitions",
    "SME story",
    "flexible capital solutions",
    "investor safety",
    "stable daily income",
    "progressive repayment",
    "revenue share lending",
    "automated credit risk scoring",
    "verified data financing",
    "Sustainability in Action 2024",
    "Australian Government",
    "SIHUB 2025",
    "Startup and Innovation Hub Ho Chi Minh City",
    "International Blockchain Olympiad 2023",
    "IBCOL 2023",
    "LENDMI",
  ],
  openGraph: {
    title: "Why Us | FundLok - Vision, Recognitions & Achievements",
    description:
      "Discover FundLok's vision and award-winning track record — recognized by the Australian Government, incubated by SIHUB, and a Top 10 project at the International Blockchain Olympiad 2023.",
    type: "website",
    siteName: "FundLok",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Us | FundLok - Vision, Recognitions & Achievements",
    description:
      "Discover FundLok's vision and award-winning track record — recognized by the Australian Government, incubated by SIHUB, and a Top 10 project at the International Blockchain Olympiad 2023.",
  },
};

export default function WhyUsPage() {
  return <WhyUsClient />;
}
