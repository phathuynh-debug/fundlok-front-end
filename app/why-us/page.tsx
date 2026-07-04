import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
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

// Structured data for FundLok's recognitions. Uses ItemList (each award as a
// CreativeWork) plus an Organization node whose `award` list links back to the
// main entity via the shared @id declared in the root layout, so Google can
// attribute these recognitions to FundLok.
const achievements = [
  {
    name: "Top 3 Project to Facilitate Investments",
    awarder: "Sustainability in Action 2024, Australian Government",
    description:
      "Recognized as a top-3 fintech project by the Australian Government for facilitating sustainable cross-border investments and ESG-aligned SME funding.",
  },
  {
    name: "Seed Stage Start-up Incubation in FinTech Industry 2025",
    awarder: "Startup and Innovation Hub Ho Chi Minh City (SIHUB)",
    description:
      "Selected for SIHUB's premium incubation program, receiving strategic mentorship, regulatory sandbox guidance, and network access to top regional venture capitals.",
  },
  {
    name: "Top 10 Potential Project Global",
    awarder: "International Blockchain Olympiad 2023 (IBCOL)",
    description:
      "Representing Vietnam (under the project name LENDMI), won a top-10 global spot for pioneering blockchain-based credit scoring and secure liquidity pooling for emerging markets.",
  },
];

const achievementsJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "FundLok",
      url: SITE_URL,
      award: achievements.map((a) => `${a.name} — ${a.awarder}`),
    },
    {
      "@type": "ItemList",
      name: "FundLok's Achievements",
      itemListElement: achievements.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          name: a.name,
          description: a.description,
          award: `${a.name} — ${a.awarder}`,
        },
      })),
    },
  ],
};

export default function WhyUsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        id="achievements-schema"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(achievementsJsonLd) }}
      />
      <WhyUsClient />
    </>
  );
}
