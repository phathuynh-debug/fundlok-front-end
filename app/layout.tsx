import type { Metadata } from "next";

import { getSeoStrings, OG_LOCALE, resolveSeoLocale } from "@/lib/seo";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import { GOOGLE_CLIENT_ID_OR_PLACEHOLDER } from "@/lib/google-oauth";
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
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SITE_URL } from "@/lib/site";
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
      icon: "/logo/image.png",
      shortcut: "/logo/image.png",
      apple: "/logo/image.png",
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
  const locale = await resolveSeoLocale();
  // Read server-side so the first paint already respects the preference —
  // see the note in components/appearance-provider.tsx.
  const reduceMotion = parseReduceMotionCookie(
    cookieStore.get(REDUCE_MOTION_COOKIE_NAME)?.value,
  );
  const accent = parseAccentCookie(cookieStore.get(ACCENT_COOKIE_NAME)?.value);
  const radius = parseRadiusCookie(cookieStore.get(RADIUS_COOKIE_NAME)?.value);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": `${SITE_URL}#organization`,
    name: "FundLok",
    alternateName: "Công ty Cổ phần FundLok",
    url: SITE_URL,
    logo: `${SITE_URL}/logo/image.png`,
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
        {/* Never an empty string: @react-oauth/google throws on init with one,
            and Next turns that hydration error into a full-page crash — taking
            password sign-in down with it. See lib/google-oauth.ts. */}
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID_OR_PLACEHOLDER}>
          <QueryProvider>
            <LocaleProvider initialLocale={locale}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
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
        </GoogleOAuthProvider>
        {/* Global notification system */}
        <Toaster />
      </body>
    </html>
  );
}
