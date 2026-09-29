"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  FileText,
  Clock,
  IdCard,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useGVerifyKybStatus, useGVerifyStatus } from "@/hooks/use-gverify";
import type { GVerifyKybDocumentType } from "@/services/gverify.service";
import { postVerificationTarget } from "../../kyc-landing";
import { StatusBlock } from "../status-block";
import { DocumentCaptureField } from "./DocumentCaptureField";
import { KycCapturePanel } from "./KycCapturePanel";
import { useGVerifyKyb } from "./useGVerifyKyb";
import type { ApiError } from "@/lib/types";
import { apiErrorMessage, backendText } from "@/lib/api-error-message";

// HOUSEHOLD was dropped 2026-07-15 per the provider integration guide — OCR X
// business verification covers company and branch certificates.
const DOCUMENT_TYPES: Array<{
  value: GVerifyKybDocumentType;
  labelKey: string;
  docLabelKey: string;
}> = [
  {
    value: "COMPANY",
    labelKey: "kyc.kyb.typeCompany",
    docLabelKey: "kyc.kyb.docLabelCompany",
  },
  {
    value: "COMPANY_BRANCH",
    labelKey: "kyc.kyb.typeBranch",
    docLabelKey: "kyc.kyb.docLabelBranch",
  },
];

// SME business verification via GVerify eKYB — an in-app flow in three steps:
//   1. the business registration certificate (photo or PDF);
//   2. the applicant's own identity — the same GVerify KYC investors do (ID
//      card + selfie, or the phone QR handoff), skipped once approved;
//   3. review & submit: we OCR the certificate, cross-check the tax code
//      against the state registry, and — with GVERIFY_KYB_REQUIRE_REP_MATCH on
//      — require the verified CCCD to be a legal representative on it.
// The verdict comes back synchronously.
export function GVerifyKybClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const { data: user } = useCurrentUser();
  const { data: status } = useGVerifyKybStatus();
  // The applicant's personal identity check (step 2). Separate query and
  // cache from the business status above.
  const { data: identity } = useGVerifyStatus();
  const identityVerified = identity?.is_approved === true;
  const {
    document,
    setFile,
    reset,
    documentType,
    selectDocumentType,
    details,
    setDetail,
    ready,
    submit,
    submitting,
  } = useGVerifyKyb();

  // After a REJECTED/FAILED verdict the result screen shows first; "try again"
  // flips into capture mode for a fresh attempt.
  const [retaking, setRetaking] = useState(false);
  // Three-step wizard: 1 = certificate type + upload; 2 = the applicant's
  // identity; 3 = review & submit. Step 2 needs a staged document, step 3 an
  // approved identity as well.
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const landing = postVerificationTarget(searchParams.get("next"), user?.role);
  const isApproved = status?.is_approved === true;

  // Approval changes what the SERVER will do with this session: proxy.ts routes
  // on /gverify/kyb/status, and it has already answered "not approved" for this
  // page load. A soft client navigation can be served from router state that
  // predates the verdict and quietly land the user back on /kyc — reported from
  // the field as "it says verified and then just sits there until I refresh".
  // A full document load is the only hop that guarantees the proxy re-evaluates
  // from scratch. `replace` so Back does not return to the verification screen.
  useEffect(() => {
    if (isApproved) {
      const id = setTimeout(() => window.location.replace(landing), 1200);
      return () => clearTimeout(id);
    }
  }, [isApproved, landing]);

  const handleSubmit = async () => {
    try {
      const verdict = await submit();
      setRetaking(false);
      if (verdict.status === "REJECTED") {
        reset();
        setStep(1);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setRetaking(false);
      // The backend refuses a KYB without an approved identity (when the
      // representative check is on) before spending any provider call.
      const needsIdentity = apiError?.code === "KYC_REQUIRED";
      setStep(needsIdentity ? 2 : 1);
      toast({
        variant: "destructive",
        title: t("kyc.gv.errorTitle"),
        description: needsIdentity
          ? t("kyc.kyb.kycRequired")
          : apiErrorMessage(apiError, locale, t("kyc.startErrorDescription")),
      });
    }
  };

  const showResult =
    !retaking && (status?.status === "REJECTED" || status?.status === "FAILED");

  // Later steps are only ever rendered with what they need: no staged
  // document (reset after rejection, type switch) falls back to step 1, and
  // the review needs an approved identity.
  const activeStep: 1 | 2 | 3 = !ready
    ? 1
    : step === 3 && !identityVerified
      ? 2
      : step;

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
            title={t("kyc.kyb.approvedTitle")}
            hint={t("kyc.kyb.approvedHint")}
          />
        ) : /* --- Loading the latest attempt --- */ !status ? (
          <StatusBlock
            icon={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
            title={t("kyc.inProgress")}
            hint={t("kyc.checking")}
          />
        ) : /* --- Parked for ops review (borderline OCR / registry mismatch) --- */ status.status ===
          "MANUAL_REVIEW" ? (
          <StatusBlock
            icon={<Clock className="h-12 w-12 text-amber-500" />}
            title={t("kyc.inReviewTitle")}
            hint={t("kyc.inReviewHint")}
          />
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
                ? "kyc.kyb.declinedTitle"
                : "kyc.gv.failedTitle",
            )}
            hint={
              status.status !== "REJECTED"
                ? t("kyc.gv.failedHint")
                : status.rejection_code === "NOT_A_REPRESENTATIVE"
                  ? t("kyc.kyb.notRepresentativeHint")
                  : backendText(
                      status.rejection_reason,
                      locale,
                      t("kyc.declinedHint"),
                    )
            }
          >
            <Button
              className="h-11 w-full"
              onClick={() => {
                setRetaking(true);
                setStep(1);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("kyc.retryBtn")}
            </Button>
          </StatusBlock>
        ) : (
          /* --- Two-step wizard: document first, then review & submit --- */
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {t("kyc.kyb.title")}
                </h1>
                <p className="text-muted-foreground">{t("kyc.kyb.subtitle")}</p>
              </div>
            </div>

            {/* Step indicator — each step unlocks once the previous is done. */}
            <div className="grid grid-cols-3 gap-2" role="tablist">
              {[
                {
                  n: 1 as const,
                  label: t("kyc.kyb.stepDocument"),
                  done: ready,
                  enabled: true,
                  Icon: FileText,
                },
                {
                  n: 2 as const,
                  label: t("kyc.kyb.stepIdentity"),
                  done: identityVerified,
                  enabled: ready,
                  Icon: IdCard,
                },
                {
                  n: 3 as const,
                  label: t("kyc.kyb.stepReview"),
                  done: false,
                  enabled: ready && identityVerified,
                  Icon: null,
                },
              ].map(({ n, label, done, enabled, Icon }) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={activeStep === n}
                  disabled={!enabled || submitting}
                  onClick={() => setStep(n)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors",
                    activeStep === n
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40",
                    !enabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    Icon && <Icon className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {label}
                </button>
              ))}
            </div>

            {activeStep === 1 ? (
              /* --- Step 1: certificate type + upload --- */
              <>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-semibold text-foreground">
                    {t("kyc.kyb.typeLabel")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOCUMENT_TYPES.map(({ value, labelKey }) => (
                      <Button
                        key={value}
                        type="button"
                        variant={documentType === value ? "default" : "outline"}
                        className="h-auto whitespace-normal px-2 py-2 text-xs"
                        disabled={submitting}
                        onClick={() => selectDocumentType(value)}
                      >
                        {t(labelKey)}
                      </Button>
                    ))}
                  </div>
                </div>

                <DocumentCaptureField
                  document={document}
                  disabled={submitting}
                  onSelect={setFile}
                  label={t(
                    DOCUMENT_TYPES.find((d) => d.value === documentType)
                      ?.docLabelKey ?? "kyc.kyb.docLabelCompany",
                  )}
                />

                <div className="space-y-1.5 text-left">
                  <label
                    htmlFor="kyb-tax-code"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t("kyc.kyb.taxCodeLabel")}
                  </label>
                  <NumericInput
                    id="kyb-tax-code"
                    maxLength={14}
                    placeholder="1501167629"
                    value={details.taxCode}
                    disabled={submitting}
                    onValueChange={(digits) => setDetail("taxCode", digits)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("kyc.kyb.taxCodeHint")}
                  </p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label
                    htmlFor="kyb-license-code"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t("kyc.kyb.licenseCodeLabel")}
                  </label>
                  <Input
                    id="kyb-license-code"
                    maxLength={32}
                    placeholder="41M8041297"
                    value={details.licenseCode}
                    disabled={submitting}
                    onChange={(e) => setDetail("licenseCode", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("kyc.kyb.licenseCodeHint")}
                  </p>
                </div>

                <Button
                  type="button"
                  className="h-12 w-full text-base font-medium"
                  disabled={!ready || submitting}
                  onClick={() => setStep(2)}
                >
                  {t("kyc.continueBtn")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : activeStep === 2 ? (
              /* --- Step 2: the applicant's identity --- */
              !identity ? (
                <StatusBlock
                  icon={
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  }
                  title={t("kyc.inProgress")}
                  hint={t("kyc.checking")}
                />
              ) : identityVerified ? (
                <>
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-left">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      <span className="text-sm font-semibold text-foreground">
                        {t("kyc.kyb.identityVerifiedTitle")}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-sm font-medium text-foreground">
                        {identity.full_name || "—"}
                      </p>
                      {identity.person_number && (
                        <p className="font-mono text-xs text-muted-foreground tabular-nums">
                          CCCD •••• {identity.person_number.slice(-4)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("kyc.kyb.identityVerifiedHint")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t("kyc.kyb.backBtn")}
                    </Button>
                    <Button
                      type="button"
                      className="h-12 flex-[2] text-base font-medium"
                      onClick={() => setStep(3)}
                    >
                      {t("kyc.continueBtn")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : identity.status === "MANUAL_REVIEW" ? (
                /* Parked for ops review: nothing to retake until it's settled. */
                <StatusBlock
                  icon={<Clock className="h-12 w-12 text-amber-500" />}
                  title={t("kyc.inReviewTitle")}
                  hint={t("kyc.gv.inReviewHint")}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("kyc.kyb.backBtn")}
                  </Button>
                </StatusBlock>
              ) : (
                <KycCapturePanel
                  onBack={() => setStep(1)}
                  heading={
                    <div className="space-y-1.5 text-left">
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <IdCard className="h-5 w-5 text-primary" />
                        {t("kyc.kyb.identityTitle")}
                      </h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t("kyc.kyb.identityHint")}
                      </p>
                    </div>
                  }
                />
              )
            ) : (
              /* --- Step 3: review & submit --- */
              <>
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("kyc.kyb.typeLabel")}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {t(
                        DOCUMENT_TYPES.find((d) => d.value === documentType)
                          ?.labelKey ?? "kyc.kyb.typeCompany",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 border-t border-border pt-3">
                    {document.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={document.previewUrl}
                        alt={t("kyc.kyb.stepDocument")}
                        className="h-16 w-24 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <FileText className="h-8 w-8 shrink-0 text-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {document.file?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {document.file
                          ? (document.file.size / (1024 * 1024)).toFixed(2)
                          : "0"}{" "}
                        MB
                      </p>
                    </div>
                  </div>
                  {identityVerified && (
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">
                        {t("kyc.kyb.reviewIdentity")}
                      </span>
                      <span className="text-right text-sm font-medium text-foreground">
                        {identity?.full_name || "—"}
                        {identity?.person_number && (
                          <span className="block font-mono text-xs font-normal text-muted-foreground tabular-nums">
                            CCCD •••• {identity.person_number.slice(-4)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("kyc.kyb.consent")}
                </p>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1"
                    disabled={submitting}
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("kyc.kyb.backBtn")}
                  </Button>
                  <Button
                    type="button"
                    className="h-12 flex-[2] text-base font-medium"
                    disabled={!ready || !identityVerified || submitting}
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
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
