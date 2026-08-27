import type { BrowserContext, Page } from "@playwright/test";

import type { StubUserKey } from "../stub-api/fixtures";
import { settle } from "./ui";

/**
 * Sign in as one of the stub accounts by seeding the session cookie.
 *
 * Why not drive the login form every time: the real cookie is httpOnly and set
 * by the backend, so there is nothing for a test to fabricate beyond the token
 * itself — and the stub API treats the token as the user's identity. Going
 * through the form on every spec would add a page load and a round trip to each
 * test while testing the same three lines of form code repeatedly. The form
 * itself IS exercised end to end, once, in login.spec.ts.
 */
export async function signInAs(
  context: BrowserContext,
  user: StubUserKey,
): Promise<void> {
  await context.addCookies([
    {
      name: "access_token",
      value: user,
      // 127.0.0.1 rather than "localhost": baseURL uses the numeric host, and
      // a cookie set for the other spelling is simply never sent.
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Force the UI into a locale. Server-rendered from this cookie (app/layout.tsx
 * reads it for `initialLocale`), so it must be set before the first navigation.
 */
export async function useLocale(
  context: BrowserContext,
  locale: "en" | "vi",
): Promise<void> {
  await context.addCookies([
    {
      // lib/i18n/index.tsx → LOCALE_COOKIE_NAME
      name: "NEXT_LOCALE",
      value: locale,
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax",
    },
  ]);
}

/**
 * Wait until the dashboard has settled: React Query has resolved /users/me and
 * the greeting is on screen. Guards against asserting on a skeleton.
 */
export async function waitForDashboard(page: Page): Promise<void> {
  await settle(page);
}
