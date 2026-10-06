"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Headphones,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/lib/i18n";
import { StatusBlock } from "../_components/status-block";
import { CaptureTabs } from "../_components/gverify/CaptureTabs";
import { useGVerifyKyc } from "../_components/gverify/useGVerifyKyc";
import { useVerificationFailures } from "../_components/use-verification-failures";
import { VerificationHelpDialog } from "../_components/VerificationHelpDialog";
import { ManualReviewNotice } from "../_components/ManualReviewNotice";
import { useVerificationMode } from "@/hooks/use-gverify";
import type {
  GVerifyVerifyResponse,
  VerificationMode,
} from "@/services/gverify.service";
import type { ApiError } from "@/lib/types";
import { apiErrorMessage, backendText } from "@/lib/api-error-message";

// Phone side of the QR handoff: opened by scanning the desktop QR, carries a
// short-lived token in the query string (?token=…) instead of a login cookie.
// The in-app camera opens on each tile (rear camera for the ID, front for the
// selfie); there is no way to pick a photo from the phone. The desktop
// discovers the verdict through its polling status query.
export function MobileKycClient() {
  const { t, locale } = useTranslations();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const modeParam = searchParams.get("mode") as VerificationMode | null;
  const { data: verificationMode } = useVerificationMode(!modeParam);
  const effectiveMode: VerificationMode =
    modeParam === "MANUAL" || modeParam === "AUTOMATIC"
      ? modeParam
      : (verificationMode?.mode ?? "AUTOMATIC");

  const { images, setFile, reset, allReady, submit, submitting } =
    useGVerifyKyc({
      handoffToken: token,
    });
  const {
    failureCount,
    isDialogOpen,
    setIsDialogOpen,
    recordFailure,
    resetFailures,
  } = useVerificationFailures("kyc");

  // The phone session has no query cache to lean on — track the outcome of
  // this submission locally.
  const [verdict, setVerdict] = useState<GVerifyVerifyResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (verdict?.is_approved) {
      resetFailures();
    }
  }, [verdict?.is_approved, resetFailures]);

  const handleSubmit = async () => {
    setFailure(null);
    try {
      const res = await submit({
        expected_mode: effectiveMode,
      });
      setVerdict(res);
      if (res.status === "REJECTED" || res.status === "FAILED") {
        recordFailure();
      } else if (res.status === "APPROVED") {
        resetFailures();
      }
    } catch (err) {
      recordFailure();
      const apiError = err as ApiError;
      const code =
        apiError?.code ||
        (apiError?.details as { code?: string })?.code ||
        (apiError as unknown as { response?: { data?: { code?: string } } })
          ?.response?.data?.code ||
        (apiError as unknown as { data?: { code?: string } })?.data?.code;
      if (code === "VERIFICATION_MODE_CHANGED") {
        setFailure(t("kyc.modeChanged"));
        return;
      }
      // 401 = the 10-minute token expired (or was tampered with).
      setFailure(
        apiError?.status === 401
          ? t("kyc.gv.mobileExpired")
          : apiErrorMessage(apiError, locale, t("kyc.gv.failedHint")),
      );
    }
  };

  const retake = () => {
    setVerdict(null);
    setFailure(null);
    reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-lg"
      >
        <div className="flex items-center justify-end">
          <LocaleSwitcher />
        </div>

        {/* --- Missing token (page opened without scanning the QR) --- */}
        {!token ? (
          <StatusBlock
            icon={<AlertTriangle className="h-12 w-12 text-amber-500" />}
            title={t("kyc.gv.mobileNoTokenTitle")}
            hint={t("kyc.gv.mobileNoTokenHint")}
          />
        ) : /* --- Approved: done on this device, continue on desktop --- */ verdict?.is_approved ? (
          <StatusBlock
            icon={<CheckCircle2 className="h-12 w-12 text-emerald-500" />}
            title={t("kyc.approvedTitle")}
            hint={t("kyc.gv.mobileApprovedHint")}
          />
        ) : /* --- Parked for ops review: nothing to retake --- */ verdict?.status ===
          "MANUAL_REVIEW" ? (
          <StatusBlock
            icon={<Clock className="h-12 w-12 text-amber-500" />}
            title={t("kyc.inReviewTitle")}
            hint={t("kyc.gv.inReviewHint")}
          />
        ) : /* --- Rejected: show reason, retake --- */ verdict ? (
          <StatusBlock
            icon={<XCircle className="h-12 w-12 text-destructive" />}
            title={t("kyc.declinedTitle")}
            hint={backendText(
              verdict.rejection_reason,
              locale,
              t("kyc.declinedHint"),
            )}
          >
            <div className="flex flex-col gap-2 w-full">
              <Button className="h-11 w-full" onClick={retake}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("kyc.retryBtn")}
              </Button>
              {failureCount >= 3 && (
                <Button
                  variant="outline"
                  asChild
                  className="h-11 w-full border-border bg-card hover:bg-accent text-foreground"
                >
                  <Link href="/contact?purpose=support">
                    <Headphones className="mr-2 h-4 w-4" />
                    {t("kyc.contactSupportBtn")}
                  </Link>
                </Button>
              )}
            </div>
          </StatusBlock>
        ) : /* --- Provider failure / expired token --- */ failure ? (
          <StatusBlock
            icon={<AlertTriangle className="h-12 w-12 text-amber-500" />}
            title={t("kyc.gv.failedTitle")}
            hint={failure}
          >
            <div className="flex flex-col gap-2 w-full">
              <Button className="h-11 w-full" onClick={retake}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("kyc.retryBtn")}
              </Button>
              {failureCount >= 3 && (
                <Button
                  variant="outline"
                  asChild
                  className="h-11 w-full border-border bg-card hover:bg-accent text-foreground"
                >
                  <Link href="/contact?purpose=support">
                    <Headphones className="mr-2 h-4 w-4" />
                    {t("kyc.contactSupportBtn")}
                  </Link>
                </Button>
              )}
            </div>
          </StatusBlock>
        ) : (
          /* --- Capture --- */
          <>
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight">
                  {t("kyc.title")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("kyc.gv.mobileSubtitle")}
                </p>
              </div>
            </div>

            {effectiveMode === "MANUAL" && <ManualReviewNotice />}

            <CaptureTabs
              images={images}
              disabled={submitting}
              onSelect={setFile}
            />

            <p className="text-xs leading-relaxed text-muted-foreground">
              {effectiveMode === "MANUAL"
                ? t("kyc.gv.consentManual")
                : t("kyc.gv.consent")}
            </p>

            <Button
              type="button"
              className="h-12 w-full text-base font-medium"
              disabled={!allReady || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("kyc.gv.submitting")}
                </>
              ) : (
                t("kyc.gv.submitBtn")
              )}
            </Button>
          </>
        )}

        <VerificationHelpDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          flow="kyc"
        />
      </motion.div>
    </div>
  );
}
