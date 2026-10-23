import { cookies, headers } from "next/headers";

import {
  ACCENT_COOKIE_NAME,
  BRAND_ACCENT_HEADER,
  RADIUS_COOKIE_NAME,
  REDUCE_MOTION_COOKIE_NAME,
  parseAccentCookie,
  parseRadiusCookie,
  parseReduceMotionCookie,
} from "@/lib/appearance";
import { NONCE_HEADER } from "@/lib/csp";
import { getSeoStrings } from "@/lib/seo";
import { SESSION_USER_HEADER, decodeSessionUser } from "@/lib/session-user";

/**
 * The per-request props of `RootDocument` (components/root-document.tsx), for
 * a document rendered per request: the app's root layout and the global 404.
 *
 * Reading cookies() and headers() here is what makes those renders dynamic —
 * which they must be, because proxy.ts gives them a nonce CSP and only a
 * per-request render can stamp that nonce on the page's scripts. Never call
 * this from app/[lang]/, whose pages are prerendered.
 */
export async function requestDocumentProps() {
  const cookieStore = await cookies();
  // The URL on a localized page (/en/login), else the cookie. Same resolver as
  // the page and its metadata, so <html lang> matches the body.
  const { locale, seo } = await getSeoStrings();
  // Read server-side so the first paint already respects the preference —
  // see the note in components/appearance-provider.tsx.
  const appearance = {
    reduceMotion: parseReduceMotionCookie(
      cookieStore.get(REDUCE_MOTION_COOKIE_NAME)?.value,
    ),
    accent: parseAccentCookie(cookieStore.get(ACCENT_COOKIE_NAME)?.value),
    radius: parseRadiusCookie(cookieStore.get(RADIUS_COOKIE_NAME)?.value),
  };
  // Set by proxy.ts. Next nonces its own scripts; next-themes renders an
  // inline one (the no-flash theme switch) that the CSP blocks without it.
  const requestHeaders = await headers();
  const nonce = requestHeaders.get(NONCE_HEADER) ?? undefined;
  // The user proxy.ts already fetched to route this request, so pages start
  // with it instead of asking /users/me again after hydrating.
  const sessionUser = decodeSessionUser(
    requestHeaders.get(SESSION_USER_HEADER),
  );
  // Set by proxy.ts on /login and the other signed-out entry pages, which keep
  // the brand accent (see BRAND_ACCENT_PATHS).
  const brandAccent = requestHeaders.get(BRAND_ACCENT_HEADER) === "1";
  return { locale, seo, appearance, nonce, sessionUser, brandAccent };
}
