// Validate a ?next= redirect target. Only same-origin absolute paths are
// accepted, so a crafted value can't turn a redirect into an open redirect.
//
// Shared by proxy.ts (server-side 307) and app/kyc/kyc-landing.ts (client
// window.location.replace) so the two can't drift apart.
//
// The checks run on the NORMALISED path, not just the raw input: URL parsing
// resolves dot-segments and turns backslashes into slashes, so a harmless-looking
// "/.//evil.com", "/%2e//evil.com" or "/./\evil.com" normalises to "//evil.com",
// which a browser reads as a protocol-relative URL to another host.
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/")) return null;
  let parsed: URL;
  try {
    parsed = new URL(next, "http://localhost");
  } catch {
    return null;
  }
  if (parsed.origin !== "http://localhost") return null;

  const path = parsed.pathname;
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return null;
  }
  return `${path}${parsed.search}${parsed.hash}`;
}
