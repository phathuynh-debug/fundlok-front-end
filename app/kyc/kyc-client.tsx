"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-authentication";
import { verificationKindForRole } from "@/services/verification.service";
import { kycLandingForRole } from "./kyc-landing";
import { DiditKycClient } from "./_components/didit-kyc-client";
import { GVerifyKycClient } from "./_components/gverify/GVerifyKycClient";

// Role switcher for the verification screen (used by /kyc and /kyc/callback):
//   INVESTOR → GVerify in-app KYC (submit ID images + portrait, synchronous verdict)
//   SME      → Didit hosted KYB (redirect + webhook)
// Roleless users pick a role first; roles that don't verify (admins) bounce to
// their landing.
export function KycClient() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const landing = kycLandingForRole(user?.role);

  useEffect(() => {
    if (!user) return;
    if (!user.role) {
      router.replace("/select-role");
    } else if (verificationKindForRole(user.role) === null) {
      router.replace(landing);
    }
  }, [user, router, landing]);

  if (user?.role === "INVESTOR") return <GVerifyKycClient />;
  // SMEs — and the pre-load state, which renders Didit's neutral spinner.
  return <DiditKycClient />;
}
