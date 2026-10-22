import type { Metadata } from "next";

import "./globals.css";
import NotFoundPage from "@/components/not-found-page";
import { RootDocument } from "@/components/root-document";
import { requestDocumentProps } from "@/lib/request-document";

/**
 * The 404 for a URL that matches no route at all. The app has two root
 * layouts (app/(app)/ and app/[lang]/), so there is no single one for Next to
 * wrap an unmatched URL in; this file supplies the whole document itself.
 * Requires `experimental.globalNotFound` in next.config.ts.
 *
 * Rendered per request, NOT prerendered: proxy.ts cannot tell an unmatched
 * URL from an app page, so it gives this one the nonce CSP, and a built page
 * has no nonce on its scripts — every one of them would be blocked. Reading
 * the request also lets it follow the visitor's language and appearance.
 */
export const metadata: Metadata = {
  title: "404 | FundLok",
  robots: { index: false, follow: false },
};

export default async function GlobalNotFound() {
  return (
    <RootDocument {...await requestDocumentProps()}>
      <NotFoundPage />
    </RootDocument>
  );
}
