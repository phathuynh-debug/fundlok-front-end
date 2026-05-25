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
    "Bastion Trading",
    "FalconX",
    "Fasanara Digital"
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
  return <LandingPageClient />
}
