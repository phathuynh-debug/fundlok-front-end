import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build output directory. Overridable so a production build can be made
  // without destroying a running dev server's `.next` — `next build` and
  // `next dev` writing to the same directory corrupts `.next/dev/types` and
  // leaves the dev server serving broken modules. The E2E suite sets
  // NEXT_DIST_DIR=.next-e2e for exactly this reason; nothing else changes.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Next blocks cross-origin requests to the dev server by default. The KYC
  // QR handoff opens the app on a phone via the Mac's LAN address, so allow
  // private-network origins in dev (no effect on production builds).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.ngrok-free.app"],
  images: {
    // An optimized image inherits the LARGER of this TTL and the upstream
    // asset's own Cache-Control, so raising it stops `/_next/image` being
    // re-derived from origin on every view. 30 days; there is no cache
    // invalidation API, so a changed image needs a new filename.
    minimumCacheTTL: 2592000,
    // Required from Next 16 — an unrestricted list lets anyone burn optimizer
    // time on qualities we never ask for. 75 is the `next/image` default.
    qualities: [75],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Static art in `public/` defaults to a 4-hour max-age on Vercel, so
        // Cloudflare re-fetches the logo and hero shell from origin several
        // times a day per PoP — a ~1.2s round trip from Vietnam. These names
        // are stable and the art changes rarely, so cache it for a day and
        // let the CDN keep serving while it revalidates in the background.
        // Changing one of these images means giving it a new filename.
        source: "/:dir(images|logo|achivements)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // All requests to /api/* are proxied to FastAPI.
        // This makes the browser see everything as same-origin (localhost:3000),
        // so httpOnly cookies are sent automatically on every request.
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://127.0.0.1:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
