import { apiErrorMessage } from "@/lib/api-error-message";
import type { ApiError } from "@/lib/types";

// The X-Error-Code values Admin > Email can answer with (backend
// app/admin/internal_email/service.py and transport.py), plus the send-log's
// SOME_RECIPIENTS_REFUSED. Each has copy under admin.email.errors.<code> in
// both dictionaries.
const KNOWN_CODES = new Set([
  "APP_PASSWORD_REQUIRED",
  "EMAIL_ENCRYPTION_UNAVAILABLE",
  "EMAIL_NOT_CONFIGURED",
  "EMAIL_DISABLED",
  "RECIPIENT_DOMAIN_NOT_ALLOWED",
  "EMAIL_RATE_LIMITED",
  "GMAIL_AUTH_FAILED",
  "GMAIL_RECIPIENT_REFUSED",
  "GMAIL_UNAVAILABLE",
  "APP_PASSWORD_UNREADABLE",
  "SOME_RECIPIENTS_REFUSED",
]);

/** Translated copy for a known failure code, else the usual fallback. */
export function emailErrorText(
  err: unknown,
  t: (key: string) => string,
  locale: string,
): string {
  const { code, status } = (err as ApiError | null) ?? {};
  if (code && KNOWN_CODES.has(code)) return t(`admin.email.errors.${code}`);
  // A validation failure the form did not catch first: on the Vietnamese
  // site "try again" would leave the admin retrying the same input.
  if (status === 422) {
    return apiErrorMessage(err, locale, t("admin.email.errors.invalid"));
  }
  return apiErrorMessage(err, locale, t("common.tryAgain"));
}

/** For a send: no answer, or a 5xx without our X-Error-Code (a proxy or
 * gateway in front of the API gave up, not the API). Either way the email may
 * still have gone, so the console must not invite a resend. */
export function isUnknownOutcome(err: unknown): boolean {
  const { status, code } = (err as ApiError | null) ?? {};
  return status === undefined || (status >= 500 && !code);
}

/** Copy for a send-log row's error_code, or null when there is none to show. */
export function emailErrorCodeText(
  code: string | null,
  t: (key: string) => string,
): string | null {
  return code && KNOWN_CODES.has(code) ? t(`admin.email.errors.${code}`) : null;
}

// No trailing or doubled dots in the domain, as the server's validator.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// Mirrors _DOMAIN in backend app/admin/internal_email/schemas.py: lower-case
// ASCII host names with a dot; IDNs in their punycode (xn--) form.
const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

// Characters that end a line in an email header: control characters and the
// Unicode line/paragraph separators the server also refuses.
export const LINE_BREAK = /[\u0000-\u001f\u007f\u0085\u2028\u2029]/;

/** A domain as the server compares it: lower-case punycode. Null when it is
 * not a host name at all. */
export function asciiDomain(domain: string): string | null {
  try {
    return new URL(`http://${domain}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Allowed-domain entries the server would reject, as typed. */
export function invalidDomains(entries: string[]): string[] {
  return entries.filter((entry) => {
    const domain = entry.toLowerCase().replace(/^@/, "");
    return !DOMAIN_PATTERN.test(domain);
  });
}

/** Split a comma/semicolon/whitespace-separated list, dropping blanks and
 * case-insensitive repeats (first spelling kept), as the server does. */
export function parseList(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value.split(/[\s,;]+/)) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    out.push(trimmed);
  }
  return out;
}
