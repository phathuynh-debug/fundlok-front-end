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
