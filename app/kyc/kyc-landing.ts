import type { UserRole } from "@/services/authentication.service";

// Where to send a user once KYC is approved — same targets as the post-login /
// post-role-selection landing. Middleware re-validates, so this is the
// optimistic first hop.
export function kycLandingForRole(role?: UserRole | string | null): string {
  if (role === "ADMIN" || role === "SYSTEM_ADMIN") return "/admin";
  if (role === "SME") return "/project-application";
  return "/dashboard"; // INVESTOR and any fallback
}
