"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ArrowLeft, Clock } from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useGVerifyStatus } from "@/hooks/use-gverify";
import { postVerificationTarget } from "../../kyc-landing";
import { StatusBlock } from "../status-block";
import { KycCapturePanel } from "./KycCapturePanel";

// Investor KYC via GVerify (Datatrust) — an in-app flow: the user stages ID
// front/back + a portrait, we submit them in one call, and the verdict comes
// back synchronously: no redirect, no webhook, no polling (except while the
// phone handoff is open). The capture itself lives in KycCapturePanel, which
// the SME's KYB flow reuses for its identity step.
export function GVerifyKycClient() {
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { data: status } = useGVerifyStatus();

  const landing = postVerificationTarget(searchParams.get("next"), user?.role);
  const isApproved = status?.is_approved === true;

  // Once approved, head into the app after a brief confirmation. Full document
  // load rather than a client navigation, for the same reason as the KYB screen
  // (see GVerifyKybClient): the proxy gates this route on the verification
  // status it read BEFORE the verdict existed, so the hop has to re-enter the
  // server rather than reuse router state.
  useEffect(() => {
    if (isApproved) {
      const id = setTimeout(() => window.location.replace(landing), 1200);
      return () => clearTimeout(id);
    }
  }, [isApproved, landing]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-lg"
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("kyc.returnBtn")}
            </Link>
          </Button>
          <LocaleSwitcher />
        </div>

        {/* --- Approved --- */}
        {isApproved ? (
          <StatusBlock
            icon={<CheckCircle2 className="h-12 w-12 text-emerald-500" />}
            title={t("kyc.approvedTitle")}
            hint={t("kyc.approvedHint")}
          />
        ) : /* --- Loading the latest attempt --- */ !status ? (
          <StatusBlock
            icon={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
            title={t("kyc.inProgress")}
            hint={t("kyc.checking")}
          />
        ) : /* --- Parked for ops review. No retry: the backend refuses a new
               attempt until someone settles this one. --- */ status.status ===
          "MANUAL_REVIEW" ? (
          <StatusBlock
            icon={<Clock className="h-12 w-12 text-amber-500" />}
            title={t("kyc.inReviewTitle")}
            hint={t("kyc.gv.inReviewHint")}
          />
        ) : (
          /* --- Phone QR / last result / capture --- */
          <KycCapturePanel />
        )}
      </motion.div>
    </div>
  );
}
