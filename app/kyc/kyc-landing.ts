import type { UserRole } from "@/services/authentication.service";

// Where to send a user once KYC is approved — same targets as the post-login /
// post-role-selection landing. Middleware re-validates, so this is the
// optimistic first hop.
export function kycLandingForRole(role?: UserRole | string | null): string {
  if (role === "ADMIN" || role === "SYSTEM_ADMIN") return "/admin";
  if (role === "SME") return "/project-application";
  return "/dashboard"; // INVESTOR and any fallback
}

// Verification is now reached on demand from a gated action, which passes a
// ?next= pointing back at that action. Prefer returning the user there once
// approved; fall back to the role landing. Only same-origin absolute paths are
// honored, so a crafted ?next= can't redirect off-site.
export function postVerificationTarget(
  next: string | null | undefined,
  role?: UserRole | string | null,
): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    try {
      const parsed = new URL(next, "http://localhost");
      if (
        parsed.origin === "http://localhost" &&
        parsed.pathname.startsWith("/")
      ) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // Invalid URL - fall through to fallback
    }
  }
  return kycLandingForRole(role);
}
