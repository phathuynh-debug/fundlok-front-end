import { apiClient } from "@/lib/api-client";
import { verificationEndpoints, type VerificationKind } from "@/lib/endpoints";
import type { UserRole } from "@/services/authentication.service";

export type { VerificationKind };

// Didit's exact, case-sensitive status strings.
export type VerificationStatus =
  | "Not Started"
  | "In Progress"
  | "Awaiting User"
  | "In Review"
  | "Resubmitted"
  | "Approved"
  | "Declined"
  | "Abandoned"
  | "Expired"
  | "Kyc Expired";

// POST /{kyc|kyb}/start — creates (or resumes) a Didit session.
export interface VerificationStartResponse {
  verification_id: string;
  session_id: string;
  status: VerificationStatus;
  verification_url: string;
}

// GET /{kyc|kyb}/status and POST /{kyc|kyb}/sync return this shape.
export interface VerificationStatusResponse {
  verification_id: string;
  session_id: string;
  status: VerificationStatus;
  verification_type: VerificationKind;
  is_terminal: boolean;
  is_approved: boolean;
  verification_url?: string;
  updated_at?: string | null;
}

// Which prefix a role uses. Investors verify identity (KYC); SMEs verify the
// business (KYB). Admins (and roleless users) don't verify — they never reach
// the verification screen, so this returns null for them.
export function verificationKindForRole(
  role?: UserRole | string | null,
): VerificationKind | null {
  if (role === "INVESTOR") return "KYC";
  if (role === "SME") return "KYB";
  return null;
}

// Synthetic status for a user who has never started (the endpoint 404s).
export function notStartedStatus(
  kind: VerificationKind,
): VerificationStatusResponse {
  return {
    verification_id: "",
    session_id: "",
    status: "Not Started",
    verification_type: kind,
    is_terminal: false,
    is_approved: false,
  };
}

export const verificationService = {
  // Begin or resume verification. Pass the current locale so Didit renders in
  // the user's language; open the returned verification_url.
  start(kind: VerificationKind, language?: string) {
    return apiClient.post<VerificationStartResponse>(
      verificationEndpoints(kind).start,
      language ? { language } : undefined,
    );
  },

  // Latest decision, read from our DB (cheap — use this for polling).
  getStatus(kind: VerificationKind) {
    return apiClient.get<VerificationStatusResponse>(
      verificationEndpoints(kind).status,
    );
  },

  // Force-refresh directly from Didit (fallback when the webhook is delayed).
  sync(kind: VerificationKind) {
    return apiClient.post<VerificationStatusResponse>(
      verificationEndpoints(kind).sync,
    );
  },
};
