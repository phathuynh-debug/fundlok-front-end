"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useGVerifyHandoff, useGVerifyStatus } from "@/hooks/use-gverify";
import { postVerificationTarget } from "../../kyc-landing";
import { StatusBlock } from "../status-block";
import { CaptureTabs } from "./CaptureTabs";
import { useGVerifyKyc } from "./useGVerifyKyc";
import type { ApiError } from "@/lib/types";

// Investor KYC via GVerify (Datatrust) — the in-app replacement for the Didit
// hosted redirect. The user stages ID front/back + a portrait, we submit them
// in one call, and the verdict comes back synchronously: no redirect, no
// webhook, no polling.
export function GVerifyKycClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { images, setFile, reset, allReady, submit, submitting } =
    useGVerifyKyc();
  const { mutateAsync: createHandoff, isPending: creatingHandoff } =
    useGVerifyHandoff();

  // After a REJECTED/FAILED verdict the result screen shows first; "try again"
  // flips into capture mode for a fresh attempt (a new attempt row server-side).
  const [retaking, setRetaking] = useState(false);
  // Phone handoff: when set, the QR panel is showing and we poll for the
  // verdict the phone produces on our behalf. baselineId is the attempt that
  // was current when the QR was minted — the phone's submission creates a NEW
  // attempt, so a different id with a terminal status means "the phone is done"
  // (a previous rejection must not be mistaken for the fresh verdict).
  const [phone, setPhone] = useState<{
    url: string;
    baselineId: string;
  } | null>(null);
  const { data: status } = useGVerifyStatus({ poll: phone !== null });

  // The phone produced a fresh verdict → the QR panel yields to the normal
  // status rendering (approved / result). Derived, not stored: the phone
  // state itself is cleared by the user's next action (retry / redirect).
  const phoneVerdictArrived =
    phone !== null &&
    !!status?.is_terminal &&
    status.verification_id !== phone.baselineId;
  const phoneActive = phone !== null && !phoneVerdictArrived;

  const handlePhone = async () => {
    try {
      const { token } = await createHandoff();
      setPhone({
        url: `${window.location.origin}/kyc/mobile?token=${encodeURIComponent(token)}`,
        baselineId: status?.verification_id ?? "",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("kyc.gv.errorTitle"),
        description:
          (err as ApiError)?.message || t("kyc.startErrorDescription"),
      });
    }
  };

  const landing = postVerificationTarget(searchParams.get("next"), user?.role);
  const isApproved = status?.is_approved === true;

  // Once approved, head into the app after a brief confirmation.
  useEffect(() => {
    if (isApproved) {
      const id = setTimeout(() => router.replace(landing), 1200);
      return () => clearTimeout(id);
    }
  }, [isApproved, router, landing]);

  const handleSubmit = async () => {
    try {
      const verdict = await submit();
      setRetaking(false);
      if (verdict.status === "REJECTED") reset();
    } catch (err) {
      const apiError = err as ApiError;
      setRetaking(false);
      toast({
        variant: "destructive",
        title: t("kyc.gv.errorTitle"),
        description: apiError?.message || t("kyc.startErrorDescription"),
      });
    }
  };

  // A fresh phone verdict overrides `retaking` — the user may have been in
  // capture mode when the phone finished on their behalf.
  const showResult =
    (!retaking || phoneVerdictArrived) &&
    (status?.status === "REJECTED" || status?.status === "FAILED");

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
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.push(landing)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("kyc.returnBtn")}
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
        ) : /* --- Phone handoff: QR + wait for the phone's verdict --- */ phoneActive &&
          phone ? (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight">
                {t("kyc.gv.qrTitle")}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("kyc.gv.qrHint")}
              </p>
            </div>
            {/* QR needs a light background to stay scannable in dark mode. */}
            <div className="mx-auto w-fit rounded-xl bg-white p-4 shadow-sm">
              <QRCode value={phone.url} size={192} />
            </div>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("kyc.gv.qrWaiting")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("kyc.gv.qrExpiry")}
            </p>
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => setPhone(null)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("kyc.gv.qrBack")}
            </Button>
          </div>
        ) : /* --- Last attempt rejected / provider failure --- */ showResult ? (
          <StatusBlock
            icon={
              status.status === "REJECTED" ? (
                <XCircle className="h-12 w-12 text-destructive" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              )
            }
            title={t(
              status.status === "REJECTED"
                ? "kyc.declinedTitle"
                : "kyc.gv.failedTitle",
            )}
            hint={
              status.status === "REJECTED"
                ? status.rejection_reason || t("kyc.declinedHint")
                : t("kyc.gv.failedHint")
            }
          >
            <Button
              className="h-11 w-full"
              onClick={() => {
                setPhone(null);
                setRetaking(true);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("kyc.retryBtn")}
            </Button>
          </StatusBlock>
        ) : (
          /* --- Capture: stage the three images and submit --- */
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {t("kyc.title")}
                </h1>
                <p className="text-muted-foreground">{t("kyc.gv.subtitle")}</p>
              </div>
            </div>

            {/* One tab per capture; the in-app guided camera (framing overlay)
                opens on desktop too — it falls back to the file picker when
                getUserMedia is unavailable (e.g. plain-http LAN origins). */}
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

            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted-foreground">
                {t("kyc.gv.or")}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={submitting || creatingHandoff}
              onClick={handlePhone}
            >
              {creatingHandoff ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="mr-2 h-4 w-4" />
              )}
              {t("kyc.gv.phoneBtn")}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
