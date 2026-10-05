// Canonical public URL of the site, used by the sitemap, robots.txt,
// metadataBase, and structured data. Must match the domain submitted to
// Google Search Console exactly (www vs non-www matters).
//
// The default is the WWW host because that is what production actually
// serves: https://fundlok.com returns a 308 to https://www.fundlok.com. With
// the bare domain as the default, every canonical, sitemap entry and JSON-LD
// @id pointed at a URL that immediately redirects — a wasted hop and a
// contradictory signal, and sitemaps are supposed to list final URLs.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.fundlok.com";
