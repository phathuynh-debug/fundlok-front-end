import type { Metadata } from "next"
import { LandingPageClient } from "./landing-page-client"

export const metadata: Metadata = {
  title: "FundLok - Radically Transforming Credit, On-Chain",
  description: "Building a marketplace of scaled on-chain credit facilities that displace legacy lending infrastructure and loan origination processes at each stage of the loan lifecycle.",
  keywords: [
    "FundLok",
    "credit on-chain",
    "lending marketplace",
    "SME funding",
    "investor portal",
    "private credit",
    "Bastion Trading",
    "FalconX",
    "Fasanara Digital"
  ],
  openGraph: {
    title: "FundLok - Radically Transforming Credit, On-Chain",
    description: "Building a marketplace of scaled on-chain credit facilities that displace legacy lending infrastructure and loan origination processes.",
    type: "website",
    siteName: "FundLok",
  },
  twitter: {
    card: "summary_large_image",
    title: "FundLok - Radically Transforming Credit, On-Chain",
    description: "Building a marketplace of scaled on-chain credit facilities that displace legacy lending infrastructure and loan origination processes.",
  }
}

export default function Page() {
  return <LandingPageClient />
}
