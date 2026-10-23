import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HydrationBoundary } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import {
  VercelAnalytics,
  VercelSpeedInsights,
} from "@/components/vercel-analytics";
import {
  ACCENT_COOKIE_NAME,
  DEFAULT_ACCENT,
  DEFAULT_RADIUS,
  RADIUS_COOKIE_NAME,
  type AccentId,
  type RadiusId,
} from "@/lib/appearance";
import { LocaleProvider } from "@/lib/i18n";
import { getMessages } from "@/lib/i18n/server";
import { OG_LOCALE, type SeoLocale, type seoStringsFor } from "@/lib/seo";
import { QueryProvider } from "@/providers/query-provider";
import type { User } from "@/services/authentication.service";
import { sessionUserState } from "@/lib/session-user-state";
import { SITE_URL } from "@/lib/site";

/**
 * The <html> document shared by the app's two root layouts.
 *
 * WHY TWO ROOT LAYOUTS
 * The marketing pages (app/[lang]/) are prerendered at build time so the CDN
 * serves them and `next/link` can prefetch them whole — that is what makes a
 * click on them instant. Everything else (app/(app)/) renders per request,
 * because it needs the session, the appearance cookies and a CSP nonce
 * (lib/csp.ts). A layout that reads cookies() or headers() makes every page
 * under it dynamic, so the two cannot share one; they share this instead.
 */

const geistSans = Geist({
  subsets: ["latin", "vietnamese"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-geist-mono",
});

const SITE_KEYWORDS = [
  "FundLok",
  "SME funding",
  "private credit",
  "flexible capital",
  "on-chain credit",
  "investor portal",
  "đầu tư SME",
  "invest in SMEs",
  "flexible funding",
  "AI business score",
  "on-chain SME funding",
  "Sustainability in Action",
  "Australian Government",
  "SIHUB FinTech",
  "IBCOL 2023",
];

type SeoStrings = ReturnType<typeof seoStringsFor>["seo"];

export function rootMetadata(locale: SeoLocale, seo: SeoStrings): Metadata {
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
    // No `icons` here on purpose. app/favicon.ico, app/icon.png and
    // app/apple-icon.png are picked up by Next's file conventions, which emit
    // the <link> tags with a content hash (/icon.png?<hash>). Hard-coding
    // "/icon.png" overrode that with a bare URL, so the browser and Cloudflare
    // could only cache it briefly and had to revalidate it on every visit.
  };
}

function localBusinessSchema(seo: SeoStrings) {
  return {
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
}

/**
 * A prerendered page cannot read the appearance cookies on the server, so it
 * ships the defaults and this swaps in the visitor's choice before the body
 * paints — the same attributes the dynamic layout renders server-side. Only the static layout uses it: the
 * dynamic one would need a nonce for it, and has no need.
 */
const APPEARANCE_SCRIPT = `(function(){try{var c=document.cookie,r=document.documentElement,m;if((m=c.match(/(?:^|; )${ACCENT_COOKIE_NAME}=([a-z-]+)/)))r.setAttribute("data-accent",m[1]);if((m=c.match(/(?:^|; )${RADIUS_COOKIE_NAME}=([a-z-]+)/)))r.setAttribute("data-radius",m[1]);}catch(e){}})();`;

export function RootDocument({
  locale,
  seo,
  appearance,
  nonce,
  sessionUser,
  children,
}: {
  locale: SeoLocale;
  seo: SeoStrings;
  /**
   * The appearance cookies, read server-side by the dynamic layout. Omitted by
   * the static layout, which applies them in the browser instead.
   */
  appearance?: {
    reduceMotion: boolean;
    accent: AccentId;
    radius: RadiusId;
  };
  /** This request's CSP nonce (dynamic layout only). */
  nonce?: string;
  /** The user proxy.ts already fetched to route this request, if any. */
  sessionUser?: User | null;
  children: React.ReactNode;
}) {
  return (
    <html
      lang={locale}
      // Rendered server-side so the accent and radius are correct on the
      // first paint; the CSS in globals.css keys off these attributes.
      data-accent={appearance?.accent ?? DEFAULT_ACCENT}
      data-radius={appearance?.radius ?? DEFAULT_RADIUS}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {!appearance && (
          <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
        )}
        <script
          type="application/ld+json"
          id="local-business-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema(seo)),
          }}
        />
        {/* GoogleOAuthProvider is NOT here: it loads Google's ~100 KB sign-in
            script on mount, so it wraps the login form only (app/(app)/login/page.tsx). */}
        <QueryProvider>
          <HydrationBoundary
            state={sessionUser ? sessionUserState(sessionUser) : undefined}
          >
            <LocaleProvider
              initialLocale={locale}
              messages={getMessages(locale)}
            >
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                nonce={nonce}
              >
                <AppearanceProvider
                  initialReduceMotion={appearance?.reduceMotion}
                  initialAccent={appearance?.accent}
                  initialRadius={appearance?.radius}
                >
                  {/* The page's one <main> landmark. Section layouts and pages
                    use plain wrappers inside it, never a second <main>. */}
                  <main>{children}</main>
                </AppearanceProvider>
              </ThemeProvider>
            </LocaleProvider>
          </HydrationBoundary>
        </QueryProvider>
        {/* Global notification system */}
        <Toaster />
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  );
}
