"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useCurrentUser } from "@/hooks/use-authentication";
import { postVerificationTarget } from "./kyc-landing";
import { GVerifyKycClient } from "./_components/gverify/GVerifyKycClient";
import { GVerifyKybClient } from "./_components/gverify/GVerifyKybClient";

// Role switcher for the verification screen (/kyc):
//   INVESTOR → GVerify in-app KYC (ID images + portrait, synchronous verdict)
//   SME      → GVerify in-app KYB (registration certificate + tax registry)
// Roleless users pick a role first; roles that don't verify (admins) bounce to
// their landing.
export function KycClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();
  const landing = postVerificationTarget(searchParams.get("next"), user?.role);
  const verifies = user?.role === "INVESTOR" || user?.role === "SME";

  useEffect(() => {
    if (!user) return;
    if (!user.role) {
      router.replace("/select-role");
    } else if (!verifies) {
      router.replace(landing);
    }
  }, [user, verifies, router, landing]);

  if (user?.role === "INVESTOR") return <GVerifyKycClient />;
  if (user?.role === "SME") return <GVerifyKybClient />;

  // Pre-load state (user not resolved yet) — a neutral spinner on the same
  // surface the GVerify screens use, so there's no flash when one takes over.
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
