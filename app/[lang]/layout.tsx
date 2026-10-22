import type { Metadata } from "next";

import "../globals.css";
import { RootDocument, rootMetadata } from "@/components/root-document";
import { MARKETING_LOCALES } from "@/lib/locale-routing";
import { pageLocale, seoStringsFor, type LangParams } from "@/lib/seo";

/**
 * Root layout for the marketing pages, prerendered at build time for each
 * language: /vi/... (served at the unprefixed URLs, which proxy.ts rewrites
 * here) and /en/....
 *
 * NOTHING UNDER THIS LAYOUT MAY READ cookies(), headers() or searchParams. Any
 * one of them turns every page here back into a per-request render, and the
 * CDN can no longer serve them or `next/link` prefetch them whole. Per-visitor
 * state (appearance, session, ?for=) is picked up in the browser instead.
 *
 * Because these pages are built once, they carry no CSP nonce; proxy.ts gives
 * them the fixed policy from lib/csp.ts instead.
 */

export function generateStaticParams() {
  return MARKETING_LOCALES.map((lang) => ({ lang }));
}

// /fr, /anything: not a language, so a 404 rather than a third build.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: LangParams;
}): Promise<Metadata> {
  const { locale, seo } = seoStringsFor(await pageLocale(params));
  return rootMetadata(locale, seo);
}

export default async function MarketingRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: LangParams;
}>) {
  const { locale, seo } = seoStringsFor(await pageLocale(params));
  return (
    <RootDocument locale={locale} seo={seo}>
      {children}
    </RootDocument>
  );
}
