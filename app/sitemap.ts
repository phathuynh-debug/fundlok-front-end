import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import {
  LOCALIZED_PATHS,
  languageAlternates,
  localizedPath,
  type RouteLocale,
} from "@/lib/locale-routing";

// Public marketing pages only — authenticated/app routes (dashboard,
// project-application) are disallowed in robots.ts and excluded here.
//
// Every page is listed once PER LANGUAGE (/rate and /en/rate), and each entry
// names all its language versions. That is Google's sitemap form of hreflang:
// without it, Google has no reliable way to pair /en/rate with /rate, and may
// treat them as two unrelated pages or show the wrong one to a searcher.

type PageMeta = Pick<
  MetadataRoute.Sitemap[number],
  "changeFrequency" | "priority"
>;

// Keyed by default-language path; must cover LOCALIZED_PATHS exactly.
const PAGES: Record<(typeof LOCALIZED_PATHS)[number], PageMeta> = {
  "/": { changeFrequency: "daily", priority: 1 },
  "/why-us": { changeFrequency: "weekly", priority: 0.8 },
  // The rate calculator: the page most likely to match what an SME actually
  // types into Google ("lãi suất vay doanh nghiệp"). The investor tab is the
  // same document at ?for=investor, so it is not listed separately.
  "/rate": { changeFrequency: "weekly", priority: 0.9 },
  "/faq": { changeFrequency: "weekly", priority: 0.7 },
  "/contact": { changeFrequency: "monthly", priority: 0.7 },
  "/terms": { changeFrequency: "monthly", priority: 0.6 },
  // Sign-up lives on this page too, at ?mode=register. The query variant is
  // deliberately not listed separately — it is the same document.
  "/login": { changeFrequency: "monthly", priority: 0.5 },
};

const LOCALES: RouteLocale[] = ["vi", "en"];

function absolute(path: string): string {
  // SITE_URL has no trailing slash; the home page is SITE_URL itself.
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return LOCALIZED_PATHS.flatMap((path) => {
    const languages = Object.fromEntries(
      Object.entries(languageAlternates(path)).map(([lang, href]) => [
        lang,
        absolute(href),
      ]),
    );
    return LOCALES.map((locale) => ({
      url: absolute(localizedPath(path, locale)),
      lastModified,
      ...PAGES[path],
      alternates: { languages },
    }));
  });
}
