import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/project-application",
        // Cloudflare's email-protection interstitial, injected on pages that
        // show an address. It is their page, not ours — it has a Cloudflare
        // title we cannot set, no content of our own, and it was being
        // crawled from /contact.
        "/cdn-cgi/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
