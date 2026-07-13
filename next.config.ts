import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next blocks cross-origin requests to the dev server by default. The KYC
  // QR handoff opens the app on a phone via the Mac's LAN address, so allow
  // private-network origins in dev (no effect on production builds).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.ngrok-free.app"],
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
