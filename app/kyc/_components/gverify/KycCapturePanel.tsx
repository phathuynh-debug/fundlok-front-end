"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  Loader2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  ArrowLeft,
  Headphones,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import {
  gverifyKeys,
  useGVerifyHandoff,
  useGVerifyStatus,
  useVerificationMode,
} from "@/hooks/use-gverify";
import { StatusBlock } from "../status-block";
import { CaptureTabs } from "./CaptureTabs";
import { useGVerifyKyc } from "./useGVerifyKyc";
import { useVerificationFailures } from "../use-verification-failures";
import { VerificationHelpDialog } from "../VerificationHelpDialog";
import { ManualReviewNotice } from "../ManualReviewNotice";
import type { ApiError } from "@/lib/types";
import { apiErrorMessage, backendText } from "@/lib/api-error-message";

// The personal identity check (GVerify KYC): stage ID front/back + a selfie
// and submit, or hand off to the phone by QR. Shared by the investor KYC screen
// and the identity step of the SME's KYB flow.
//
// Renders only the three "still working on it" states — phone QR, last attempt
// rejected/failed, and capture. The parent owns what happens around them
// (loading, approved, under review), because that differs: the investor screen
// leaves for the app on approval, the KYB step moves on to its review.
export function KycCapturePanel({
  heading,
  onBack,
  flow = "kyc",
}: {
  // Shown above the capture tabs. Defaults to the investor KYC heading.
  heading?: ReactNode;
  // When set, the capture state offers a Back button (e.g. to the previous
  // KYB step).
  onBack?: () => void;
  // Flow identity: 'kyc' for investor personal KYC, 'kyb' when embedded in SME KYB.
  flow?: "kyc" | "kyb";
}) {
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const queryClient = useQueryClient();
  const { data: verificationMode } = useVerificationMode();
  const { images, setFile, reset, allReady, submit, submitting } =
    useGVerifyKyc();
  const { mutateAsync: createHandoff, isPending: creatingHandoff } =
    useGVerifyHandoff();
  const {
    failureCount,
    isDialogOpen,
    setIsDialogOpen,
    recordFailure,
    resetFailures,
  } = useVerificationFailures(flow);

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

  useEffect(() => {
    if (status?.is_approved) {
      resetFailures();
    }
  }, [status?.is_approved, resetFailures]);

  // The phone produced a fresh verdict → the QR panel yields to the normal
  // status rendering. Derived, not stored: the phone state itself is cleared by
  // the user's next action (retry), or the parent moves on (approved).
  const phoneVerdictArrived =
    phone !== null &&
    !!status?.is_terminal &&
    status.verification_id !== phone.baselineId;
  const phoneActive = phone !== null && !phoneVerdictArrived;

  const lastRecordedPhoneAttemptRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      phoneVerdictArrived &&
      status?.verification_id &&
      status.verification_id !== lastRecordedPhoneAttemptRef.current &&
      (status.status === "REJECTED" || status.status === "FAILED")
    ) {
      lastRecordedPhoneAttemptRef.current = status.verification_id;
      recordFailure();
    }
  }, [
    phoneVerdictArrived,
    status?.verification_id,
    status?.status,
    recordFailure,
  ]);

  const fail = (err: unknown) =>
    toast({
      variant: "destructive",
      title: t("kyc.gv.errorTitle"),
      description: apiErrorMessage(
        err as ApiError,
        locale,
        t("kyc.startErrorDescription"),
      ),
    });

  const handlePhone = async () => {
    try {
      const res = await createHandoff();
      const mode = res.mode || verificationMode?.mode;
      const modeParam = mode ? `&mode=${encodeURIComponent(mode)}` : "";
      setPhone({
        url: `${window.location.origin}/kyc/mobile?token=${encodeURIComponent(res.token)}${modeParam}`,
        baselineId: status?.verification_id ?? "",
      });
    } catch (err) {
      fail(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const verdict = await submit({
        expected_mode: verificationMode?.mode,
      });
      setRetaking(false);
      if (verdict.status === "REJECTED" || verdict.status === "FAILED") {
        reset();
        recordFailure();
      } else if (verdict.status === "APPROVED") {
        resetFailures();
      }
    } catch (err) {
      setRetaking(false);
      const apiErr = err as ApiError;
      const code =
        apiErr?.code ||
        (apiErr?.details as { code?: string })?.code ||
        (apiErr as unknown as { response?: { data?: { code?: string } } })
          ?.response?.data?.code ||
        (apiErr as unknown as { data?: { code?: string } })?.data?.code;
      if (code === "VERIFICATION_MODE_CHANGED") {
        void queryClient.invalidateQueries({
          queryKey: gverifyKeys.verificationMode(),
        });
        toast({
          variant: "destructive",
          title: t("kyc.gv.errorTitle"),
          description: t("kyc.modeChanged"),
        });
        return;
      }
      recordFailure();
      fail(err);
    }
  };

  // A fresh phone verdict overrides `retaking` — the user may have been in
  // capture mode when the phone finished on their behalf.
  const showResult =
    (!retaking || phoneVerdictArrived) &&
    (status?.status === "REJECTED" || status?.status === "FAILED");

  /* --- Phone handoff: QR + wait for the phone's verdict --- */
  if (phoneActive && phone) {
    return (
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
        <p className="text-xs text-muted-foreground">{t("kyc.gv.qrExpiry")}</p>
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={() => setPhone(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("kyc.gv.qrBack")}
        </Button>
      </div>
    );
  }

  /* --- Last attempt rejected / provider failure --- */
  if (showResult && status) {
    return (
      <>
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
              ? backendText(
                  status.rejection_reason,
                  locale,
                  t("kyc.declinedHint"),
                )
              : t("kyc.gv.failedHint")
          }
        >
          <div className="flex flex-col gap-2 w-full">
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
        <VerificationHelpDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          flow={flow}
        />
      </>
    );
  }

  /* --- Capture: stage the three images and submit --- */
  return (
    <>
      {heading ?? (
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
      )}

      {/* Embedded in the KYB wizard (custom heading), the wizard shows the
          notice once at its top instead. */}
      {!heading && <ManualReviewNotice />}

      {/* One tab per capture. Each photo is taken live with the in-app guided
          camera (framing overlay); there is no way to upload one. Where the
          camera cannot open (no webcam, blocked, or a plain-http origin) the
          field says why, and the phone button below is the way on. */}
      <CaptureTabs images={images} disabled={submitting} onSelect={setFile} />

      <p className="text-xs leading-relaxed text-muted-foreground">
        {/* Manual mode never sends the photos to the provider, so the
            consent line has to say who actually looks at them. */}
        {verificationMode?.mode === "MANUAL"
          ? t("kyc.gv.consentManual")
          : t("kyc.gv.consent")}
      </p>

      <div className="flex gap-2">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1"
            disabled={submitting}
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("kyc.kyb.backBtn")}
          </Button>
        )}
        <Button
          type="button"
          className="h-12 flex-[2] text-base font-medium"
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
      </div>

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

      <VerificationHelpDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        flow={flow}
      />
    </>
  );
}
