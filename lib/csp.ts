/**
 * Content-Security-Policy for every page the app renders.
 *
 * WHY A NONCE AND NOT A STATIC HEADER
 * Next renders inline bootstrap scripts (`self.__next_f.push(...)`) into every
 * page. A policy set once in next.config.ts cannot name them, so it would
 * need `script-src 'unsafe-inline'` — which also lets any injected <script>
 * run and defeats most of the point of a CSP. Instead proxy.ts mints a fresh
 * nonce per request and passes this policy on the REQUEST headers; Next reads
 * the nonce back out of `script-src` and stamps it on every script it renders.
 * Nothing else needs a nonce: `'strict-dynamic'` lets those scripts load the
 * third-party SDKs below (Google Sign-In, Turnstile, Vercel Analytics) without
 * the browser checking each one against a host list.
 *
 * A nonce requires a per-request render, which costs nothing for the app: its
 * root layout (app/(app)/layout.tsx) reads cookies(), so those pages are
 * dynamically rendered anyway.
 *
 * THE MARKETING PAGES GET A FIXED POLICY INSTEAD
 * app/[lang]/ (home, why-us, rate, faq, contact, terms) is prerendered once at
 * build time so the CDN can serve it and `next/link` can prefetch it — the
 * reason clicks between those pages are instant. A page built once cannot
 * carry a per-request nonce, and Next's inline bootstrap scripts differ per
 * build, so they cannot be hashed either. Those pages therefore get
 * `script-src 'unsafe-inline'` plus the host list below, without
 * 'strict-dynamic' (which would make the browser ignore both). This is a
 * deliberate trade-off, accepted for pages that show no user-supplied content
 * and hold no session data; every page that does — the app, admin, /login —
 * keeps the nonce. Pass `null` for the fixed policy.
 *
 * STYLES STAY 'unsafe-inline'
 * React writes `style="..."` attributes (Radix positioning, framer-motion,
 * recharts) and the chart component injects a <style> element. Nonces cannot
 * cover style attributes, and a nonce in `style-src` would make browsers
 * ignore 'unsafe-inline' and break all of them. Inline styles cannot run code,
 * so this is the usual trade-off.
 *
 * ADDING A THIRD PARTY
 * A new embed, upload target or API host will be blocked until it is listed
 * here — check the browser console for "Refused to ..." after adding one.
 */

/** Request header carrying the nonce to server components (app/layout.tsx). */
export const NONCE_HEADER = "x-nonce";

/**
 * Cloudflare R2, where presigned URLs point: direct uploads (PUT), avatars and
 * document previews (<img>, and PDFs in an <iframe>). Wildcarded because the
 * account id is a backend setting (R2_ENDPOINT_URL) the frontend never sees;
 * it still only admits R2, not arbitrary hosts.
 */
const STORAGE_ORIGINS = ["https://*.r2.cloudflarestorage.com"];

/** MinIO from the backend's docker-compose stands in for R2 locally. */
const DEV_STORAGE_ORIGINS = ["http://localhost:9000", "http://127.0.0.1:9000"];

/**
 * The live-notification relay's websocket origin, or nothing if realtime is
 * not configured. partysocket picks ws:// for local and private-network hosts
 * and wss:// for everything else, so this mirrors that rule.
 */
function partykitOrigin(): string[] {
  const raw = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (!raw) return [];
  const host = raw.replace(/^(https?|wss?):\/\//, "").replace(/\/$/, "");
  const isLocal =
    /^(localhost|127\.0\.0\.1|\[::ffff:7f00:1\]):/.test(host) ||
    /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host);
  return [`${isLocal ? "ws" : "wss"}://${host}`];
}

/** 128 random bits, base64 — the shape Next's nonce parser accepts. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export function contentSecurityPolicy(nonce: string | null): string {
  // React reconstructs server error stacks with eval() in development only.
  const isDev = process.env.NODE_ENV === "development";
  const storage = isDev
    ? [...STORAGE_ORIGINS, ...DEV_STORAGE_ORIGINS]
    : STORAGE_ORIGINS;

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // With a nonce, the host entries are ignored by browsers that understand
    // 'strict-dynamic' and only matter to older ones that do not. Without one
    // (the marketing pages) they are the list that is enforced.
    "script-src": [
      "'self'",
      ...(nonce
        ? [`'nonce-${nonce}'`, "'strict-dynamic'"]
        : ["'unsafe-inline'"]),
      "https://accounts.google.com/gsi/client",
      "https://challenges.cloudflare.com",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://accounts.google.com/gsi/style",
    ],
    // data: for the logo in the admin email preview, blob: for local previews
    // of a file before it is uploaded.
    "img-src": ["'self'", "data:", "blob:", ...storage],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      "https://accounts.google.com/gsi/",
      ...storage,
      ...partykitOrigin(),
    ],
    "frame-src": [
      "'self'",
      "blob:",
      "https://accounts.google.com/gsi/",
      "https://challenges.cloudflare.com",
      // The document guide video.
      "https://www.youtube.com",
      ...storage,
    ],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'self'"],
    // Same as X-Frame-Options: DENY in next.config.ts, for browsers that
    // only honour one of the two.
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
