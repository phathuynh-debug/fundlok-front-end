import { cookies } from "next/headers";

import en from "@/lib/i18n/en.json";
import vi from "@/lib/i18n/vi.json";

/**
 * Locale-aware page metadata.
 *
 * WHY THIS EXISTS
 * `export const metadata` is evaluated once, at build time, and cannot read a
 * cookie. So while the rendered page followed NEXT_LOCALE, the <title> and
 * <meta description> stayed on whatever language was hardcoded. A crawler sends
 * no cookie, which meant Google saw a Vietnamese page described by an English
 * title: the snippet did not match the content it pointed at.
 *
 * `generateMetadata()` runs per request, so the two finally agree.
 *
 * WHAT THIS DOES NOT FIX
 * One URL can only be indexed in ONE language. Cookie-switched locales give
 * Google nothing to point `hreflang` at, so the non-default language is
 * effectively unindexable. Real bilingual search presence needs distinct URLs
 * per locale (/vi/... and /en/...). This makes the default language correct;
 * it does not make the site bilingual to a crawler.
 */
export type SeoLocale = "en" | "vi";

/**
 * Vietnamese unless English was explicitly chosen. Must stay in step with
 * `getLocaleFromCookie` in app/layout.tsx and DEFAULT_LOCALE in lib/i18n:
 * if metadata and body disagree, the snippet misdescribes the page again.
 */
export async function resolveSeoLocale(): Promise<SeoLocale> {
  const store = await cookies();
  return store.get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";
}

/** OpenGraph wants a POSIX-style locale, not the bare language tag. */
export const OG_LOCALE: Record<SeoLocale, string> = {
  en: "en_US",
  vi: "vi_VN",
};

export async function getSeoStrings() {
  const locale = await resolveSeoLocale();
  return { locale, seo: (locale === "en" ? en : vi).seo };
}
