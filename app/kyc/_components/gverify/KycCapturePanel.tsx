"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  Loader2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Headphones,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  gverifyKeys,
  useGVerifyHandoffToken,
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

// The personal identity check (GVerify KYC):
// On desktop / laptop, identity verification is done strictly via mobile phone by
// scanning the QR code (no desktop webcam capture).
// On mobile devices, camera capture runs directly on the device.
// Shared by investor KYC and the identity step of SME KYB.
export function KycCapturePanel({
  heading,
  onBack,
  flow = "kyc",
}: {
  heading?: ReactNode;
  onBack?: () => void;
  flow?: "kyc" | "kyb";
}) {
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { data: verificationMode } = useVerificationMode();
  const { images, setFile, reset, allReady, submit, submitting } =
    useGVerifyKyc();
  const {
    failureCount,
    isDialogOpen,
    setIsDialogOpen,
    recordFailure,
    resetFailures,
  } = useVerificationFailures(flow);

  const [retaking, setRetaking] = useState(false);
  const [baselineId, setBaselineId] = useState<string | null>(null);

  const { data: status } = useGVerifyStatus({ poll: !isMobile });

  useEffect(() => {
    if (status?.is_approved) {
      resetFailures();
    }
  }, [status?.is_approved, resetFailures]);

  const phoneVerdictArrived =
    !isMobile &&
    !!status?.is_terminal &&
    Boolean(status.verification_id && status.verification_id !== baselineId);

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

  const fail = useCallback(
    (err: unknown) =>
      toast({
        variant: "destructive",
        title: t("kyc.gv.errorTitle"),
        description: apiErrorMessage(
          err as ApiError,
          locale,
          t("kyc.startErrorDescription"),
        ),
      }),
    [toast, t, locale],
  );

  const showResult =
    (!retaking || phoneVerdictArrived) &&
    (status?.status === "REJECTED" || status?.status === "FAILED");

  const {
    data: handoffData,
    isLoading: handoffLoading,
    error: handoffError,
    refetch: refetchHandoff,
  } = useGVerifyHandoffToken(!isMobile && !showResult);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const effectiveMode = handoffData?.mode || verificationMode?.mode;
  const modeParam = effectiveMode
    ? `&mode=${encodeURIComponent(effectiveMode)}`
    : "";
  const qrUrl = handoffData?.token
    ? `${origin}/kyc/mobile?token=${encodeURIComponent(handoffData.token)}${modeParam}`
    : null;

  const handleRetake = () => {
    setBaselineId(status?.verification_id ?? null);
    setRetaking(true);
    void refetchHandoff();
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
            <Button className="h-11 w-full" onClick={handleRetake}>
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

  /* --- Desktop: Phone handoff via QR code exclusively --- */
  if (!isMobile) {
    if (handoffError) {
      return (
        <div className="space-y-5 text-center">
          {heading ?? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {t("kyc.gv.qrTitle")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("kyc.gv.qrHint")}
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-destructive">
            {apiErrorMessage(
              handoffError,
              locale,
              t("kyc.startErrorDescription"),
            )}
          </p>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => void refetchHandoff()}
            disabled={handoffLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("kyc.retryBtn")}
          </Button>
          {onBack && (
            <Button variant="outline" className="h-11 w-full" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("kyc.kyb.backBtn")}
            </Button>
          )}
        </div>
      );
    }

    if (handoffLoading || !qrUrl) {
      return (
        <div className="space-y-5 text-center">
          {heading ?? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {t("kyc.gv.qrTitle")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("kyc.gv.qrHint")}
                </p>
              </div>
            </div>
          )}
          {!heading && <ManualReviewNotice />}
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("kyc.gv.qrWaiting")}
            </p>
          </div>
          {onBack && (
            <Button variant="outline" className="h-11 w-full" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("kyc.kyb.backBtn")}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5 text-center">
        {heading ?? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {t("kyc.gv.qrTitle")}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("kyc.gv.qrHint")}
              </p>
            </div>
          </div>
        )}
        {!heading && <ManualReviewNotice />}
        {/* QR needs a light background to stay scannable in dark mode. */}
        <div
          data-testid="kyc-qr-code"
          data-qr-value={qrUrl}
          className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-sm border border-border/40"
        >
          <QRCode value={qrUrl} size={200} />
        </div>
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {t("kyc.gv.qrWaiting")}
        </p>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>{t("kyc.gv.qrExpiry")}</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => void refetchHandoff()}
            className="inline-flex items-center gap-1 text-primary hover:underline"
            disabled={handoffLoading}
          >
            <RotateCcw className="h-3 w-3" />
            {t("kyc.retryBtn")}
          </button>
        </div>
        {onBack && (
          <Button variant="outline" className="h-11 w-full" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("kyc.kyb.backBtn")}
          </Button>
        )}
      </div>
    );
  }

  /* --- Mobile: in-app camera capture directly on device --- */
  return (
    <>
      {heading ?? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("kyc.title")}
            </h1>
            <p className="text-muted-foreground">{t("kyc.gv.subtitle")}</p>
          </div>
        </div>
      )}

      {!heading && <ManualReviewNotice />}

      <CaptureTabs images={images} disabled={submitting} onSelect={setFile} />

      <p className="text-xs leading-relaxed text-muted-foreground">
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

      <VerificationHelpDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        flow={flow}
      />
    </>
  );
}
