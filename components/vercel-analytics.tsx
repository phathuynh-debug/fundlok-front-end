"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Vercel Web Analytics and Speed Insights record the full URL of every page view,
// and some of ours carry a bearer secret in the query string: the phone KYC handoff
// (/kyc/mobile?token=) and email verification (/verify-email?token=). Anyone
// with access to the analytics dashboard would see them. So the query string
// is cut down to UTM tags before the event leaves the browser — an allowlist,
// so a secret added to some URL later is dropped without anyone remembering
// to add it here.
function redactUrl<T extends { url: string }>(event: T): T {
  const url = new URL(event.url);
  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("utm_")) kept.append(key, value);
  });
  url.search = kept.toString();
  url.hash = "";
  return { ...event, url: url.toString() };
}

// Analytics and Speed Insights scripts are served by Vercel's edge network.
// In local environments and CI/E2E test runs, requesting these paths returns 404s.
// Only enable when running on Vercel and not in E2E testing mode.
const isVercelEnvironment =
  process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" &&
  Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL);

// Client components because beforeSend is a function, which the server
// root layout cannot pass across the boundary.
export function VercelAnalytics() {
  if (!isVercelEnvironment) {
    return null;
  }
  return <Analytics beforeSend={redactUrl} />;
}

export function VercelSpeedInsights() {
  if (!isVercelEnvironment) {
    return null;
  }
  return <SpeedInsights beforeSend={redactUrl} />;
}
