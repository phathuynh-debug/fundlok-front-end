import type { Metadata } from "next";

import "../globals.css";
import { RootDocument, rootMetadata } from "@/components/root-document";
import { requestDocumentProps } from "@/lib/request-document";
import { getSeoStrings } from "@/lib/seo";

/**
 * Root layout for every page rendered per request: the app (dashboard, admin,
 * KYC, auth) and /login. It reads cookies() and headers(), which makes each
 * page under it dynamic — that is intended here, since these pages need the
 * session and a CSP nonce. The marketing pages have their own, prerendered
 * root layout in app/[lang]/ (see components/root-document.tsx for why).
 */

// Per request, not per build: see lib/seo.ts for why a const cannot work here.
export async function generateMetadata(): Promise<Metadata> {
  const { locale, seo } = await getSeoStrings();
  return rootMetadata(locale, seo);
}

export default async function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootDocument {...await requestDocumentProps()}>{children}</RootDocument>
  );
}
