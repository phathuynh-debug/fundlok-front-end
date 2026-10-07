"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Vercel Web Analytics records the full URL of every page view, and some of
// ours carry a bearer secret in the query string: the phone KYC handoff
// (/kyc/mobile?token=) and email verification (/verify-email?token=). Anyone
// with access to the analytics dashboard would see them. So the query string
// is cut down to UTM tags before the event leaves the browser — an allowlist,
// so a secret added to some URL later is dropped without anyone remembering
// to add it here.
function redactUrl(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("utm_")) kept.append(key, value);
  });
  url.search = kept.toString();
  url.hash = "";
  return { ...event, url: url.toString() };
}

// A client component because beforeSend is a function, which the server
// root layout cannot pass across the boundary.
export function VercelAnalytics() {
  return <Analytics beforeSend={redactUrl} />;
}
