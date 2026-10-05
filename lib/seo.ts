import { cookies, headers } from "next/headers";

import en from "@/lib/i18n/en.json";
import vi from "@/lib/i18n/vi.json";
import {
  LOCALE_HEADER,
  languageAlternates,
  localizedPath,
} from "@/lib/locale-routing";

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
 * BILINGUAL INDEXING
 * One URL can only be indexed in ONE language, so the public pages now have a
 * URL per language (/rate and /en/rate, see lib/locale-routing.ts) and each
 * names the other with `hreflang` via `localeAlternates()` below.
 */
export type SeoLocale = "en" | "vi";

/**
 * The language to render this request in. Every server reader goes through
 * here -- the root layout, page bodies, metadata -- so body, <title> and
 * <html lang> cannot disagree.
 *
 *   1. A localized public page: the URL decides. proxy.ts sets LOCALE_HEADER
 *      from the /en prefix (and to "vi" without it), so /rate is Vietnamese
 *      even for a visitor whose cookie says English; otherwise the page would
 *      contradict its own canonical and hreflang.
 *   2. Anything else: the NEXT_LOCALE cookie, Vietnamese by default.
 */
export async function resolveSeoLocale(): Promise<SeoLocale> {
  const fromUrl = (await headers()).get(LOCALE_HEADER);
  if (fromUrl === "en" || fromUrl === "vi") return fromUrl;
  const store = await cookies();
  return store.get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";
}

/**
 * `alternates` for a localized page's metadata: canonical at THIS language's
 * URL, and every language version named for hreflang. A page whose canonical
 * pointed at the other language would ask Google to drop itself.
 */
export function localeAlternates(path: string, locale: SeoLocale) {
  return {
    canonical: localizedPath(path, locale),
    languages: languageAlternates(path),
  };
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
