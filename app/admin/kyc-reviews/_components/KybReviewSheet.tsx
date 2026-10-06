"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { KybCertificatePreview } from "./KybCertificatePreview";
import { documentTypeLabel } from "./KybReviewQueue";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-authentication";
import {
  useAdminKybVerification,
  useResolveKybReview,
} from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import { apiErrorMessage } from "@/lib/api-error-message";
import type { AdminDecision, AdminKybReview } from "@/services/admin.service";

// The review panel for one business verification (KYB).
//
// The reviewer's question: is this certificate genuine, is it this business,
// and is the applicant one of its legal representatives? So the panel shows
// why the attempt is here, the certificate itself, what was declared or read
// from it, and the applicant's own verified identity to compare with the
// representatives printed on it.
//
// A manual-mode attempt had no OCR or registry check: approving it needs the
// business name and tax code as printed (the SME's declared code pre-fills).
// Unlike KYC, a rejection note is shown to the SME as the reason, so the
// placeholder says so.

// 10-digit MST, optionally -NNN for a branch.
const TAX_CODE_PATTERN = /^\d{10}(-\d{3})?$/;

interface CertificateDetails {
  businessName: string;
  taxCode: string;
}

interface KybReviewSheetProps {
  verificationId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function KybReviewSheet({
  verificationId,
  onOpenChange,
}: KybReviewSheetProps) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const { data, isLoading, isError } = useAdminKybVerification(verificationId);
  const { mutateAsync: resolve, isPending } = useResolveKybReview();

  // Keyed by attempt id, like the KYC panel: nothing typed for one business
  // follows the reviewer to the next.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<
    Record<string, Partial<CertificateDetails>>
  >({});
  const note = verificationId ? (notes[verificationId] ?? "") : "";
  const edit = verificationId ? (edits[verificationId] ?? {}) : {};
  // Typed values win; until the reviewer types, show what is on file.
  const businessName = edit.businessName ?? data?.business_name ?? "";
  const taxCode = edit.taxCode ?? data?.tax_code ?? "";

  const setNote = (value: string) => {
    if (verificationId)
      setNotes((prev) => ({ ...prev, [verificationId]: value }));
  };
  const setEdit = (field: keyof CertificateDetails, value: string) => {
    if (verificationId) {
      setEdits((prev) => ({
        ...prev,
        [verificationId]: { ...prev[verificationId], [field]: value },
      }));
    }
  };

  const isParked = data?.status === "MANUAL_REVIEW";
  const isSelf = !!data && !!me && data.user.id === me.id;
  const manualAttempt = !!data && !data.provider_checked;
  const cleanTaxCode = taxCode.replace(/\s+/g, "");
  const taxCodeInvalid =
    cleanTaxCode.length > 0 && !TAX_CODE_PATTERN.test(cleanTaxCode);
  const detailsMissing =
    manualAttempt && (!businessName.trim() || !cleanTaxCode);
  const approveBlocked = manualAttempt && (detailsMissing || taxCodeInvalid);

  const handleDecision = async (decision: AdminDecision) => {
    if (!data) return;
    try {
      await resolve({
        id: data.id,
        body: {
          decision,
          note: note.trim() || null,
          ...(manualAttempt && decision === "APPROVED"
            ? {
                business_name: businessName.trim() || null,
                tax_code: cleanTaxCode || null,
              }
            : {}),
        },
      });
      setNote("");
      toast({ title: t("admin.kycReviews.resolved") });
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.kycReviews.resolveFailed"),
        description: apiErrorMessage(err, locale, t("common.tryAgain")),
      });
    }
  };

  return (
    <Sheet open={verificationId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {data?.projects[0] ||
              data?.business_name ||
              t("admin.kybReviews.sheetTitle")}
          </SheetTitle>
          <SheetDescription>
            {t("admin.kybReviews.sheetSubtitle")}
          </SheetDescription>
        </SheetHeader>

        {isError ? (
          <p role="alert" className="px-4 py-6 text-sm text-destructive">
            {t("admin.kybReviews.detailLoadFailed")}
          </p>
        ) : isLoading || !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 px-4 pb-8">
            {/* --- Why it's here --- */}
            {isParked && (
              <section className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-px h-4 w-4 shrink-0" aria-hidden />
                <div className="space-y-0.5">
                  <p className="font-semibold">
                    {t("admin.kycReviews.whyHeading")}
                  </p>
                  <p>
                    {manualAttempt
                      ? t("admin.kybReviews.whyManual")
                      : t("admin.kybReviews.whyProvider")}
                  </p>
                </div>
              </section>
            )}

            {/* --- The certificate --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.kybReviews.certificateHeading")}
              </h3>
              <KybCertificatePreview verificationId={data.id} />
            </section>

            <Separator />

            {/* --- What was declared / read --- */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {t("admin.kycReviews.attemptHeading")}
                </h3>
                <Badge
                  variant={
                    data.status === "REJECTED" ? "destructive" : "secondary"
                  }
                >
                  {enumLabel(t, "verificationStatus", data.status)}
                </Badge>
              </div>
              <AttemptFields data={data} />
            </section>

            <Separator />

            {/* --- Who applied --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.kybReviews.applicantHeading")}
              </h3>
              <ApplicantCard data={data} />
            </section>

            {/* --- Decision --- */}
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.kycReviews.decisionHeading")}
              </h3>
              {!isParked ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.kybReviews.alreadyDecided")}
                </p>
              ) : isSelf ? (
                <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <AlertTriangle
                    className="mt-px h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  <span>{t("admin.kybReviews.selfBlocked")}</span>
                </p>
              ) : (
                <div className="space-y-2">
                  {manualAttempt && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-foreground">
                        {t("admin.kybReviews.certificateDetailsHeading")}
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor={`kyb-name-${data.id}`}>
                          {t("admin.kybReviews.inputBusinessName")}
                        </Label>
                        <Input
                          id={`kyb-name-${data.id}`}
                          autoComplete="off"
                          maxLength={300}
                          value={businessName}
                          disabled={isPending}
                          onChange={(event) =>
                            setEdit("businessName", event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`kyb-tax-${data.id}`}>
                          {t("admin.kybReviews.inputTaxCode")}
                        </Label>
                        <Input
                          id={`kyb-tax-${data.id}`}
                          inputMode="numeric"
                          autoComplete="off"
                          className="font-mono tabular-nums"
                          value={taxCode}
                          disabled={isPending}
                          aria-invalid={taxCodeInvalid}
                          onChange={(event) =>
                            setEdit("taxCode", event.target.value)
                          }
                        />
                        {taxCodeInvalid && (
                          <p className="text-[11px] text-destructive">
                            {t("admin.kybReviews.taxCodeInvalid")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <Textarea
                    id={`kyb-review-note-${data.id}`}
                    rows={3}
                    value={note}
                    disabled={isPending}
                    placeholder={t("admin.kybReviews.notePlaceholder")}
                    aria-label={t("admin.kybReviews.notePlaceholder")}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      disabled={isPending || approveBlocked}
                      onClick={() => handleDecision("APPROVED")}
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      )}
                      {t("admin.kycReviews.approve")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={isPending}
                      onClick={() => handleDecision("REJECTED")}
                    >
                      <XCircle className="mr-2 h-3.5 w-3.5" />
                      {t("admin.kycReviews.reject")}
                    </Button>
                  </div>
                  {detailsMissing && (
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {t("admin.kybReviews.detailsRequired")}
                    </p>
                  )}
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {t("admin.kybReviews.rejectHint")}
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </>
  );
}

function AttemptFields({ data }: { data: AdminKybReview }) {
  const { t, locale } = useTranslations();
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <Row label={t("admin.kybReviews.fields.documentType")}>
        {documentTypeLabel(t, data.document_type)}
      </Row>
      <Row label={t("admin.kybReviews.fields.businessName")}>
        {data.business_name || "—"}
      </Row>
      <Row label={t("admin.kybReviews.fields.taxCode")}>
        <span className="font-mono tabular-nums">{data.tax_code || "—"}</span>
        {!data.provider_checked && data.tax_code && (
          <span className="ml-2 text-xs text-muted-foreground">
            {t("admin.kybReviews.declaredBySme")}
          </span>
        )}
      </Row>
      <Row label={t("admin.kybReviews.fields.licenseCode")}>
        <span className="font-mono tabular-nums">
          {data.license_code || "—"}
        </span>
      </Row>
      {data.provider_checked && (
        <>
          <Row label={t("admin.kybReviews.fields.businessType")}>
            {data.business_type || "—"}
          </Row>
          <Row label={t("admin.kybReviews.fields.address")}>
            {data.company_address || "—"}
          </Row>
        </>
      )}
      <Row label={t("admin.kycReviews.fields.submitted")}>
        {data.created_at ? formatDateTime(data.created_at, locale) : "—"}
      </Row>
    </dl>
  );
}

// The account behind the attempt, its companies on FundLok, and its own
// verified identity — the person who should appear as a legal representative.
function ApplicantCard({ data }: { data: AdminKybReview }) {
  const { t, locale } = useTranslations();
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl border border-border bg-muted/30 p-3 text-xs">
        <dt className="text-muted-foreground">
          {t("admin.kycReviews.fields.email")}
        </dt>
        <dd className="min-w-0 break-all text-foreground">{data.user.email}</dd>
        <dt className="text-muted-foreground">
          {t("admin.kybReviews.fields.projects")}
        </dt>
        <dd className="min-w-0 break-words text-foreground">
          {data.projects.length > 0 ? data.projects.join(", ") : "—"}
        </dd>
        <dt className="text-muted-foreground">
          {t("admin.kycReviews.fields.accountStatus")}
        </dt>
        <dd>
          <Badge
            variant={
              data.user.status === "SUSPENDED" ? "destructive" : "secondary"
            }
          >
            {enumLabel(t, "userStatus", data.user.status)}
          </Badge>
        </dd>
        <dt className="text-muted-foreground">
          {t("admin.kycReviews.fields.joined")}
        </dt>
        <dd className="text-foreground">
          {data.user.created_at
            ? formatDate(data.user.created_at, locale)
            : "—"}
        </dd>
      </dl>

      <div className="space-y-1.5 rounded-xl border border-border p-3 text-xs">
        <p className="font-medium text-foreground">
          {t("admin.kybReviews.ownerKycHeading")}
        </p>
        {data.kyc_person_number || data.kyc_full_name ? (
          <>
            <p className="text-foreground">
              {data.kyc_full_name || "—"}
              {data.kyc_person_number && (
                <span className="ml-2 font-mono tabular-nums text-muted-foreground">
                  {data.kyc_person_number}
                </span>
              )}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {t("admin.kybReviews.ownerKycHint")}
            </p>
          </>
        ) : (
          <p className="leading-relaxed text-muted-foreground">
            {t("admin.kybReviews.ownerKycNone")}
          </p>
        )}
      </div>
    </div>
  );
}
