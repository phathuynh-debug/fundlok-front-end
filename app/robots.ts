import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Do NOT disallow /cdn-cgi/. Cloudflare's email obfuscation rewrites the
      // footer mailto into a link to /cdn-cgi/l/email-protection on every page.
      // That page already answers 404 with `noindex`, but a robots block hides
      // both from Google, so it indexed the bare URL from the links instead
      // ("Indexed, though blocked by robots.txt", Oct 2026). Left crawlable,
      // Google sees the noindex and drops it.
      disallow: ["/dashboard/", "/project-application"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
