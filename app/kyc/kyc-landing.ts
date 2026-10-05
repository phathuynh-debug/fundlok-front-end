import type { UserRole } from "@/services/authentication.service";
import { safeNextPath } from "@/lib/safe-next-path";

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
  return safeNextPath(next) ?? kycLandingForRole(role);
}
