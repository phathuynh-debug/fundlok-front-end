"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/lib/i18n";
import { StatusBlock } from "../_components/status-block";
import { CaptureTabs } from "../_components/gverify/CaptureTabs";
import { useGVerifyKyc } from "../_components/gverify/useGVerifyKyc";
import type { GVerifyVerifyResponse } from "@/services/gverify.service";
import type { ApiError } from "@/lib/types";

// Phone side of the QR handoff: opened by scanning the desktop QR, carries a
// short-lived token in the query string (?token=…) instead of a login cookie.
// The camera opens directly on each tile (rear for the ID, front for the
// selfie); the desktop discovers the verdict through its polling status query.
export function MobileKycClient() {
  const { t } = useTranslations();
  const token = useSearchParams().get("token") ?? "";
  const { images, setFile, reset, allReady, submit, submitting } =
    useGVerifyKyc({
      handoffToken: token,
    });

  // The phone session has no query cache to lean on — track the outcome of
  // this submission locally.
  const [verdict, setVerdict] = useState<GVerifyVerifyResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFailure(null);
    try {
      setVerdict(await submit());
    } catch (err) {
      const apiError = err as ApiError;
      // 401 = the 10-minute token expired (or was tampered with).
      setFailure(
        apiError?.status === 401
          ? t("kyc.gv.mobileExpired")
          : apiError?.message || t("kyc.gv.failedHint"),
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
        ) : /* --- Rejected: show reason, retake --- */ verdict ? (
          <StatusBlock
            icon={<XCircle className="h-12 w-12 text-destructive" />}
            title={t("kyc.declinedTitle")}
            hint={verdict.rejection_reason || t("kyc.declinedHint")}
          >
            <Button className="h-11 w-full" onClick={retake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("kyc.retryBtn")}
            </Button>
          </StatusBlock>
        ) : /* --- Provider failure / expired token --- */ failure ? (
          <StatusBlock
            icon={<AlertTriangle className="h-12 w-12 text-amber-500" />}
            title={t("kyc.gv.failedTitle")}
            hint={failure}
          >
            <Button className="h-11 w-full" onClick={retake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("kyc.retryBtn")}
            </Button>
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

            <CaptureTabs
              images={images}
              disabled={submitting}
              onSelect={setFile}
              cameraCapture
            />

            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("kyc.gv.consent")}
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
      </motion.div>
    </div>
  );
}
