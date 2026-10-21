import type { User } from "@/services/authentication.service";

// Hand-off of the signed-in user from proxy.ts to the page render.
//
// The proxy already calls GET /users/me to route a gated page. Before this,
// that answer was thrown away and the page asked again from the browser
// (useCurrentUser) after hydrating: a second round trip to FastAPI, in series,
// behind a spinner, on every full page load of the dashboard or admin. Now
// the proxy puts the body it got on the request, and the root layout seeds it
// into React Query under the same key (lib/session-user-state.ts), so useCurrentUser starts with data.
//
// The header is display data only. It is never read for authorization: every
// gate is decided in the proxy, and the backend checks the cookie on every API
// call. The proxy also deletes any copy the browser sent, so a page can only
// ever see the value the proxy itself got from the backend.
export const SESSION_USER_HEADER = "x-fundlok-session-user";

// Request headers share one size budget with the cookies. A user too large to
// fit (a very long email signature, say) is simply not seeded, and the page
// falls back to fetching it as before.
const MAX_ENCODED_LENGTH = 8 * 1024;

function toBase64Url(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  );
}

/**
 * Header value for the /users/me body, or null when it should not be sent.
 * Base64url because header values are bytes and names are often Vietnamese.
 */
export function encodeSessionUser(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const encoded = toBase64Url(JSON.stringify(user));
  return encoded.length <= MAX_ENCODED_LENGTH ? encoded : null;
}

/** The user the proxy handed over, or null for none or an unreadable value. */
export function decodeSessionUser(value: string | null): User | null {
  if (!value) return null;
  try {
    const user = JSON.parse(fromBase64Url(value)) as unknown;
    return user && typeof user === "object" && "id" in user
      ? (user as User)
      : null;
  } catch {
    return null;
  }
}
