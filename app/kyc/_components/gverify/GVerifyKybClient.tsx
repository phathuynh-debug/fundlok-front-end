"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useGVerifyKybStatus } from "@/hooks/use-gverify";
import type { GVerifyKybDocumentType } from "@/services/gverify.service";
import { postVerificationTarget } from "../../kyc-landing";
import { StatusBlock } from "../status-block";
import { DocumentCaptureField } from "./DocumentCaptureField";
import { useGVerifyKyb } from "./useGVerifyKyb";
import type { ApiError } from "@/lib/types";

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

// SME business verification via GVerify eKYB — an in-app flow: the SME uploads
// the business registration certificate (photo or PDF), we OCR it and
// cross-check the tax code against the state registry, and the verdict comes
// back synchronously.
export function GVerifyKybClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { data: status } = useGVerifyKybStatus();
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
  // Two-step wizard: 1 = certificate type + upload; 2 = review & submit.
  // Step 2 is reachable only once a document is staged.
  const [step, setStep] = useState<1 | 2>(1);

  const landing = postVerificationTarget(searchParams.get("next"), user?.role);
  const isApproved = status?.is_approved === true;

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
      if (verdict.status === "REJECTED") {
        reset();
        setStep(1);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setRetaking(false);
      setStep(1);
      toast({
        variant: "destructive",
        title: t("kyc.gv.errorTitle"),
        description: apiError?.message || t("kyc.startErrorDescription"),
      });
    }
  };

  const showResult =
    !retaking && (status?.status === "REJECTED" || status?.status === "FAILED");

  // The review step is only ever rendered with a staged document — if the
  // file vanishes (reset after rejection, type switch), fall back to step 1.
  const activeStep: 1 | 2 = ready ? step : 1;

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
              status.status === "REJECTED"
                ? status.rejection_reason || t("kyc.declinedHint")
                : t("kyc.gv.failedHint")
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

            {/* Step indicator — step 2 is locked until a document is staged. */}
            <div className="grid grid-cols-2 gap-2" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeStep === 1}
                disabled={submitting}
                onClick={() => setStep(1)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors",
                  activeStep === 1
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40",
                )}
              >
                {ready ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                )}
                {t("kyc.kyb.stepDocument")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeStep === 2}
                disabled={!ready || submitting}
                onClick={() => setStep(2)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors",
                  activeStep === 2
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40",
                  !ready && "cursor-not-allowed opacity-50",
                )}
              >
                {t("kyc.kyb.stepReview")}
              </button>
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
                  <Input
                    id="kyb-tax-code"
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="1501167629"
                    value={details.taxCode}
                    disabled={submitting}
                    onChange={(e) => setDetail("taxCode", e.target.value)}
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
            ) : (
              /* --- Step 2: review & submit --- */
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
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("kyc.kyb.backBtn")}
                  </Button>
                  <Button
                    type="button"
                    className="h-12 flex-[2] text-base font-medium"
                    disabled={!ready || submitting}
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
