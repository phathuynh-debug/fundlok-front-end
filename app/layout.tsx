import type { Metadata } from "next";

import { getSeoStrings, OG_LOCALE } from "@/lib/seo";
import { cookies, headers } from "next/headers";
import { NONCE_HEADER } from "@/lib/csp";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import {
  ACCENT_COOKIE_NAME,
  RADIUS_COOKIE_NAME,
  REDUCE_MOTION_COOKIE_NAME,
  parseAccentCookie,
  parseRadiusCookie,
  parseReduceMotionCookie,
} from "@/lib/appearance";
import { QueryProvider } from "@/providers/query-provider";
import { LocaleProvider } from "@/lib/i18n";
import { getMessages } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import {
  VercelAnalytics,
  VercelSpeedInsights,
} from "@/components/vercel-analytics";
const geistSans = Geist({
  subsets: ["latin", "vietnamese"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-geist-mono",
});

// Per request, not per build: see lib/seo.ts for why a const cannot work here.
export async function generateMetadata(): Promise<Metadata> {
  const { locale, seo } = await getSeoStrings();
  const { siteTitle, siteDescription } = seo;

  return {
    // Resolves relative canonical/OG URLs (e.g. "/faq") to absolute ones.
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: "%s | FundLok",
    },
    description: siteDescription,
    keywords: SITE_KEYWORDS,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      type: "website",
      siteName: "FundLok",
      locale: OG_LOCALE[locale],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
    },
    icons: {
      // 1:1 square brand mark, served by the app/icon.png and app/favicon.ico
      // file conventions. The previous value pointed at /logo/image.png or
      // /apple-icon.png, which do not exist.
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/icon.png",
    },
  };
}

const SITE_KEYWORDS = [
  "FundLok",
  "SME funding",
  "private credit",
  "flexible capital",
  "on-chain credit",
  "investor portal",
  "flexible funding",
  "AI business score",
  "on-chain SME funding",
  "Sustainability in Action",
  "Australian Government",
  "SIHUB FinTech",
  "IBCOL 2023",
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  // The URL on a localized public page (/en/...), else the cookie. Same
  // resolver as the page and its metadata, so <html lang> matches the body.
  const { locale, seo } = await getSeoStrings();
  // Read server-side so the first paint already respects the preference —
  // see the note in components/appearance-provider.tsx.
  const reduceMotion = parseReduceMotionCookie(
    cookieStore.get(REDUCE_MOTION_COOKIE_NAME)?.value,
  );
  const accent = parseAccentCookie(cookieStore.get(ACCENT_COOKIE_NAME)?.value);
  const radius = parseRadiusCookie(cookieStore.get(RADIUS_COOKIE_NAME)?.value);
  // Set by proxy.ts. Next nonces its own scripts; next-themes renders an
  // inline one (the no-flash theme switch) that the CSP blocks without it.
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": `${SITE_URL}#organization`,
    name: "FundLok",
    alternateName: "Công ty Cổ phần FundLok",
    // The hero <h1> in this page's language, so the entity carries the phrase
    // people search for alongside the brand name.
    slogan: seo.slogan,
    url: SITE_URL,
    // The square mark (Google requires a 1:1 logo), not the wordmark.
    logo: `${SITE_URL}/icon.png`,
    image: `${SITE_URL}/images/icon-square-512.png`,
    description:
      "FundLok arranges funding for SMEs in Vietnam. Investors provide the capital and the credit agreement is between the investor and the business; FundLok is not a bank and does not lend its own money.",
    // Geography is the half of "funding for SMEs in Vietnam" the site never
    // stated. The postal address alone leaves it implied, not asserted.
    areaServed: {
      "@type": "Country",
      name: "Vietnam",
    },
    knowsLanguage: ["vi", "en"],
    telephone: "094 371 13 82",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Trương Định/123 Võ Thị Sáu",
      addressLocality: "Xuân Hòa",
      addressRegion: "Hồ Chí Minh",
      addressCountry: "VN",
    },
    sameAs: [
      "https://www.linkedin.com/company/fundlok",
      "https://www.facebook.com/profile.php?id=61579474545924",
      "https://www.instagram.com/fundlokvn/",
    ],
  };

  return (
    <html
      lang={locale}
      // Rendered server-side so the accent and radius are correct on the
      // first paint; the CSS in globals.css keys off these attributes.
      data-accent={accent}
      data-radius={radius}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          id="local-business-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        {/* GoogleOAuthProvider is NOT here: it loads Google's ~100 KB sign-in
            script on mount, so it wraps the login form only (app/login/page.tsx). */}
        <QueryProvider>
          <LocaleProvider initialLocale={locale} messages={getMessages(locale)}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              nonce={nonce}
            >
              <AppearanceProvider
                initialReduceMotion={reduceMotion}
                initialAccent={accent}
                initialRadius={radius}
              >
                <main>{children}</main>
              </AppearanceProvider>
            </ThemeProvider>
          </LocaleProvider>
        </QueryProvider>
        {/* Global notification system */}
        <Toaster />
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  );
}
