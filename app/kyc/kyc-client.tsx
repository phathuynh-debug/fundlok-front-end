"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-authentication";
import { verificationKindForRole } from "@/services/verification.service";
import { postVerificationTarget } from "./kyc-landing";
import { DiditKycClient } from "./_components/didit-kyc-client";
import { GVerifyKycClient } from "./_components/gverify/GVerifyKycClient";
import { GVerifyKybClient } from "./_components/gverify/GVerifyKybClient";

// Role switcher for the verification screen (used by /kyc and /kyc/callback):
//   INVESTOR → GVerify in-app KYC (ID images + portrait, synchronous verdict)
//   SME      → GVerify in-app KYB (registration certificate + tax registry)
// The Didit hosted client remains only as the pre-load fallback (and for any
// straggler returning to /kyc/callback from an old Didit session).
// Roleless users pick a role first; roles that don't verify (admins) bounce to
// their landing.
export function KycClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();
  const landing = postVerificationTarget(searchParams.get("next"), user?.role);

  useEffect(() => {
    if (!user) return;
    if (!user.role) {
      router.replace("/select-role");
    } else if (verificationKindForRole(user.role) === null) {
      router.replace(landing);
    }
  }, [user, router, landing]);

  if (user?.role === "INVESTOR") return <GVerifyKycClient />;
  if (user?.role === "SME") return <GVerifyKybClient />;
  // Pre-load state (user not resolved yet) — Didit's neutral spinner.
  return <DiditKycClient />;
}
