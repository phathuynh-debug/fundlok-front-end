"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  Camera,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/use-authentication";
import {
  useVerificationStatus,
  useStartVerification,
  useSyncVerification,
} from "@/hooks/use-verification";
import { postVerificationTarget } from "../kyc-landing";
import { StatusBlock } from "./status-block";
import type { ApiError } from "@/lib/types";

// The Didit hosted-flow verification screen (used by SMEs for KYB — investors
// use the in-app GVerify flow, see ./gverify/). Handles every status: consent
// for a fresh start, live polling while a session is in flight, auto-redirect
// on approval, and retry for terminal failures.
export function DiditKycClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const { data: user } = useCurrentUser();
  const { data: status } = useVerificationStatus({ poll: true });
  const { mutateAsync: start, isPending: starting } = useStartVerification();
  const { mutate: sync, isPending: syncing } = useSyncVerification();
  const syncedRef = useRef(false);

  const landing = postVerificationTarget(searchParams.get("next"), user?.role);
  const s = status?.status;
  const isApproved = status?.is_approved === true;

  // The user has a session that's begun but isn't terminal yet (e.g. they just
  // returned from Didit). "In Review" is excluded — a human decides that one.
  const inFlight =
    !!status && !status.is_terminal && s !== "Not Started" && s !== "In Review";

  // Didit's webhook lags behind its UI, so a just-finished user can land here
  // still showing a pending status. Force one sync to pull the real decision.
  useEffect(() => {
    if (inFlight && !syncedRef.current) {
      syncedRef.current = true;
      sync();
    }
  }, [inFlight, sync]);

  // Once approved, head into the app after a brief confirmation.
  useEffect(() => {
    if (isApproved) {
      const id = setTimeout(() => router.replace(landing), 1200);
      return () => clearTimeout(id);
    }
  }, [isApproved, router, landing]);

  const handleStart = async () => {
    try {
      // Pass the UI locale so Didit's hosted flow matches the user's language.
      const { verification_url } = await start(locale);
      window.location.href = verification_url; // full-page redirect to Didit
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("kyc.startErrorTitle"),
        description:
          (err as ApiError)?.message || t("kyc.startErrorDescription"),
      });
    }
  };

  const terminalFailed =
    s === "Declined" ||
    s === "Abandoned" ||
    s === "Expired" ||
    s === "Kyc Expired";

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
        ) : /* --- In flight: still verifying --- */ inFlight || !status ? (
          <StatusBlock
            icon={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
            title={t("kyc.inProgress")}
            hint={t("kyc.checking")}
          >
            <Button
              variant="outline"
              className="h-11 w-full"
              disabled={syncing}
              onClick={() => sync()}
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t("kyc.refreshBtn")}
            </Button>
          </StatusBlock>
        ) : /* --- Under human review --- */ s === "In Review" ? (
          <StatusBlock
            icon={<Clock className="h-12 w-12 text-amber-500" />}
            title={t("kyc.inReviewTitle")}
            hint={t("kyc.inReviewHint")}
          >
            <Button
              variant="outline"
              className="h-11 w-full"
              disabled={syncing}
              onClick={() => sync()}
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t("kyc.refreshBtn")}
            </Button>
          </StatusBlock>
        ) : /* --- Terminal failure / resubmit: offer retry --- */ terminalFailed ||
          s === "Resubmitted" ? (
          <StatusBlock
            icon={
              s === "Resubmitted" ? (
                <RotateCcw className="h-12 w-12 text-amber-500" />
              ) : (
                <XCircle className="h-12 w-12 text-destructive" />
              )
            }
            title={t(
              s === "Resubmitted"
                ? "kyc.resubmitTitle"
                : s === "Declined"
                  ? "kyc.declinedTitle"
                  : s === "Abandoned"
                    ? "kyc.abandonedTitle"
                    : "kyc.expiredTitle",
            )}
            hint={t(
              s === "Resubmitted"
                ? "kyc.resubmitHint"
                : s === "Declined"
                  ? "kyc.declinedHint"
                  : s === "Abandoned"
                    ? "kyc.abandonedHint"
                    : "kyc.expiredHint",
            )}
          >
            <Button
              className="h-11 w-full"
              disabled={starting}
              onClick={handleStart}
            >
              {starting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              {s === "Resubmitted" ? t("kyc.resumeBtn") : t("kyc.retryBtn")}
            </Button>
          </StatusBlock>
        ) : (
          /* --- Not Started: consent + begin --- */
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {t("kyc.title")}
                </h1>
                <p className="text-muted-foreground">{t("kyc.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-left">
              <p className="text-sm font-semibold text-foreground">
                {t("kyc.consentTitle")}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("kyc.consent")}
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Camera className="h-3.5 w-3.5" />
                {t("kyc.cameraNote")}
              </p>
            </div>

            <Button
              className="h-12 w-full text-base font-medium"
              disabled={starting}
              onClick={handleStart}
            >
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("kyc.starting")}
                </>
              ) : (
                <>
                  {t("kyc.startBtn")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
