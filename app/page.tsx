import type { Metadata } from "next"
import { LandingPageClient } from "./landing-page-client"

export const metadata: Metadata = {
  title: "FundLok | Flexible Capital Platform for SMEs",
  description: "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
  keywords: [
    "FundLok",
    "SME funding",
    "private credit",
    "flexible capital",
    "on-chain credit",
    "investor portal",
    "flexible funding",
    "AI credit scoring",
    "FalconX",
    "Fasanara Digital",
    "Loc Vuong",
    "Huy Pham",
    "Edward Wong",
    "FundLok CEO",
    "FundLok CFO",
    "FundLok CTO",
    "FundLok founding team",
    "FundLok founders",
    "Sustainability in Action 2024",
    "Australian Government",
    "SIHUB 2025",
    "Startup and Innovation Hub Ho Chi Minh City",
    "International Blockchain Olympiad 2023",
    "IBCOL 2023",
    "LENDMI"
  ],
  openGraph: {
    title: "FundLok | Flexible Capital Platform for SMEs",
    description: "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
    type: "website",
    siteName: "FundLok",
  },
  twitter: {
    card: "summary_large_image",
    title: "FundLok | Flexible Capital Platform for SMEs",
    description: "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
  }
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FundLok",
    "url": "https://www.fundlok.com",
    "logo": "https://www.fundlok.com/images/logo.png",
    "description": "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
    "award": [
      "Top 3 Project to Facilitate Investments - Sustainability in Action 2024 (Australian Government)",
      "Seed Stage Start-up Incubation in FinTech Industry 2025 (Startup and Innovation Hub Ho Chi Minh City - SIHUB)",
      "Top 10 Potential Project Global - International Blockchain Olympiad 2023 (IBCOL)"
    ],
    "founder": [
      {
        "@type": "Person",
        "name": "Loc Vuong",
        "jobTitle": "Co-Founder & CEO",
        "sameAs": "https://www.linkedin.com/in/lok-vuong/"
      },
      {
        "@type": "Person",
        "name": "Huy Pham",
        "jobTitle": "Co-Founder & CFO",
        "sameAs": "https://www.linkedin.com/in/huy-pham-5646bb49/"
      },
      {
        "@type": "Person",
        "name": "Edward Wong",
        "jobTitle": "Co-Founder & CTO",
        "sameAs": "https://www.linkedin.com/in/eywong8/"
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  )
}
