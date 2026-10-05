/**
 * Shared secret proving a request to FastAPI came from this Next.js app.
 *
 * WHAT THIS IS FOR
 * The backend origin (Cloud Run) is reachable from the public internet, so
 * anyone who learns its URL can skip the frontend entirely and hit the API
 * directly. Every Next → FastAPI call carries this header so a Cloudflare rule
 * in front of the backend can drop anything that arrives without it.
 *
 * WHAT IT IS NOT
 * Not authentication, and not a per-user credential. It says "this request came
 * through our frontend", nothing about *who* is making it — user identity is
 * still the httpOnly session cookie the backend validates on its own. It also
 * does not stop anyone from calling the backend *through* the /api proxy, which
 * stays open to the world by design; it only closes the direct route around it.
 *
 * SERVER ONLY
 * `BACKEND_SECRET_KEY` deliberately has no NEXT_PUBLIC_ prefix, so Next refuses
 * to inline it into the client bundle. Every caller here runs on the server —
 * proxy.ts and services/middleware.service.ts. Importing this from a Client
 * Component would read `undefined` rather than leak the value, but it would
 * also silently drop the header, so don't.
 */

/**
 * Header name. Kept here rather than typed at each call site so the Cloudflare
 * rule and the code can never disagree about spelling — a mismatch would lock
 * the frontend out of its own backend, and header names are case-insensitive
 * per RFC 9110 but rule editors are not always.
 */
export const BACKEND_SECRET_HEADER = "X-Backend-Secret";

/** Logged at most once per server process, not per request. */
let warned = false;

function readSecret(): string | undefined {
  const secret = process.env.BACKEND_SECRET_KEY;
  if (secret) return secret;

  if (!warned) {
    warned = true;
    // Not fatal on purpose. Failing closed here would take the whole app down
    // over a missing env var, and it would buy nothing: if the secret is unset
    // in production, the Cloudflare rule rejects every call anyway. A loud log
    // beats an outage with no explanation.
    console.warn(
      `[backend-secret] BACKEND_SECRET_KEY is not set — outgoing API calls will ` +
        `omit ${BACKEND_SECRET_HEADER}. Fine locally; in production this means ` +
        `Cloudflare will reject them.`,
    );
  }
  return undefined;
}

/**
 * Headers to merge into a server-side fetch to FastAPI.
 *
 * Returns an empty object when unconfigured so `{ ...backendSecretHeaders() }`
 * is always safe to spread — no `undefined` header value, which `fetch` would
 * reject.
 */
export function backendSecretHeaders(): Record<string, string> {
  const secret = readSecret();
  return secret ? { [BACKEND_SECRET_HEADER]: secret } : {};
}

/**
 * Stamp the secret onto a Headers object, for the proxy rewrite path where the
 * incoming request's headers are forwarded wholesale.
 *
 * Deletes first: the header is something only this server may assert, so a
 * client that sent its own `X-Backend-Secret` must not have it forwarded. Set()
 * alone would already overwrite when configured, but when the secret is unset
 * the client's value would otherwise pass straight through to the backend.
 */
export function applyBackendSecret(headers: Headers): Headers {
  headers.delete(BACKEND_SECRET_HEADER);
  const secret = readSecret();
  if (secret) headers.set(BACKEND_SECRET_HEADER, secret);
  return headers;
}
