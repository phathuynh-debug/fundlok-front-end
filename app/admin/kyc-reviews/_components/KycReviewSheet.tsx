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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { KycImageTile } from "./KycImageTile";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-authentication";
import {
  useAdminKycVerification,
  useResolveKycVerification,
} from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import { apiErrorMessage } from "@/lib/api-error-message";
import {
  KYC_IMAGE_NAMES,
  type AdminDecision,
  type AdminKycAccountRef,
} from "@/services/admin.service";

// The review panel for one KYC attempt.
//
// Built around the one question the reviewer has to answer: do this account
// and the one already verified with the same ID number belong to the same
// person? So it shows why the attempt was flagged, both accounts side by side,
// and the images this attempt submitted, before the decision controls.
//
// Approving a provider-flagged attempt needs a note (the API refuses without
// one) because it overrides a fraud signal. The note is for colleagues only: a
// rejected investor sees a fixed message, never what was typed here.
//
// An attempt submitted in manual verification mode had no OCR or face match:
// the reviewer compares the selfie with the card and types the ID number, name
// and date of birth from the card. The ID number and name are required to
// approve; the note is optional unless the server finds the number already
// verified on another account.

// CMND (9 digits) or CCCD (12), spaces allowed while typing.
const PERSON_NUMBER_PATTERN = /^\d{9}(\d{3})?$/;

interface CardDetails {
  personNumber: string;
  fullName: string;
  dateOfBirth: string;
}

const EMPTY_DETAILS: CardDetails = {
  personNumber: "",
  fullName: "",
  dateOfBirth: "",
};

interface KycReviewSheetProps {
  verificationId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function KycReviewSheet({
  verificationId,
  onOpenChange,
}: KycReviewSheetProps) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const { data, isLoading, isError } = useAdminKycVerification(verificationId);
  const { mutateAsync: resolve, isPending } = useResolveKycVerification();

  // Keyed by attempt id: a note typed against one investor must not follow
  // the operator to the next one they open.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const note = verificationId ? (notes[verificationId] ?? "") : "";
  const setNote = (value: string) => {
    if (verificationId) {
      setNotes((prev) => ({ ...prev, [verificationId]: value }));
    }
  };

  // Same keying as notes: typed details belong to one attempt.
  const [detailsById, setDetailsById] = useState<Record<string, CardDetails>>(
    {},
  );
  const details = verificationId
    ? (detailsById[verificationId] ?? EMPTY_DETAILS)
    : EMPTY_DETAILS;
  const setDetail = (field: keyof CardDetails, value: string) => {
    if (verificationId) {
      setDetailsById((prev) => ({
        ...prev,
        [verificationId]: {
          ...(prev[verificationId] ?? EMPTY_DETAILS),
          [field]: value,
        },
      }));
    }
  };

  const isParked = data?.status === "MANUAL_REVIEW";
  const isSelf = !!data && !!me && data.user.id === me.id;
  const noteMissing = note.trim().length === 0;
  const manualAttempt = !!data && !data.provider_checked;
  const personNumber = details.personNumber.replace(/\s+/g, "");
  const personNumberInvalid =
    personNumber.length > 0 && !PERSON_NUMBER_PATTERN.test(personNumber);
  const detailsMissing =
    manualAttempt && (!personNumber || !details.fullName.trim());
  // Known conflicts need a note; for a manual attempt the server re-checks
  // the typed number and asks for one if it finds a conflict there.
  const noteRequired =
    !!data && (data.provider_checked || data.conflicts.length > 0);
  const approveBlocked =
    (noteRequired && noteMissing) ||
    detailsMissing ||
    (manualAttempt && personNumberInvalid);

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
                person_number: personNumber || null,
                full_name: details.fullName.trim() || null,
                date_of_birth: details.dateOfBirth.trim() || null,
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
            {data?.user.full_name ||
              data?.user.email ||
              t("admin.kycReviews.sheetTitle")}
          </SheetTitle>
          <SheetDescription>
            {t("admin.kycReviews.sheetSubtitle")}
          </SheetDescription>
        </SheetHeader>

        {isError ? (
          <p role="alert" className="px-4 py-6 text-sm text-destructive">
            {t("admin.kycReviews.detailLoadFailed")}
          </p>
        ) : isLoading || !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 px-4 pb-8">
            {/* --- Why it's here --- */}
            {isParked && (
              <section
                className={
                  data.conflicts.length > 0
                    ? "flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-foreground"
                    : "flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground"
                }
              >
                {data.conflicts.length > 0 ? (
                  <AlertTriangle
                    className="mt-px h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                    aria-hidden
                  />
                ) : (
                  <Info className="mt-px h-4 w-4 shrink-0" aria-hidden />
                )}
                <div className="space-y-0.5">
                  <p className="font-semibold">
                    {t("admin.kycReviews.whyHeading")}
                  </p>
                  <p>
                    {data.conflicts.length > 0
                      ? t("admin.kycReviews.whyDuplicate")
                      : manualAttempt
                        ? t("admin.kycReviews.whyManual")
                        : t("admin.kycReviews.whyNoConflict")}
                  </p>
                </div>
              </section>
            )}

            {/* --- This attempt --- */}
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
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <Row label={t("admin.kycReviews.fields.idNumber")}>
                  <span className="font-mono tabular-nums">
                    {data.person_number || "—"}
                  </span>
                </Row>
                <Row label={t("admin.kycReviews.fields.nameOnCard")}>
                  {data.full_name || "—"}
                </Row>
                <Row label={t("admin.kycReviews.fields.dateOfBirth")}>
                  {data.date_of_birth || "—"}
                </Row>
                <Row label={t("admin.kycReviews.fields.faceMatch")}>
                  {data.face_match_score === null
                    ? "—"
                    : t("admin.kycReviews.faceMatchValue").replace(
                        "{score}",
                        String(Math.round(data.face_match_score * 100)),
                      )}
                </Row>
                <Row label={t("admin.kycReviews.fields.submitted")}>
                  {data.created_at
                    ? formatDateTime(data.created_at, locale)
                    : "—"}
                </Row>
              </dl>
              <AccountCard account={data.user} />
            </section>

            {/* --- The account(s) already verified with this number --- */}
            {data.conflicts.length > 0 && (
              <>
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    {t("admin.kycReviews.conflictHeading")}
                  </h3>
                  <ul className="space-y-3">
                    {data.conflicts.map((conflict) => (
                      <li key={conflict.verification_id} className="space-y-2">
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                          <Row label={t("admin.kycReviews.fields.nameOnCard")}>
                            {conflict.full_name || "—"}
                          </Row>
                          <Row label={t("admin.kycReviews.fields.dateOfBirth")}>
                            {conflict.date_of_birth || "—"}
                          </Row>
                          <Row label={t("admin.kycReviews.fields.verified")}>
                            {conflict.approved_at
                              ? formatDateTime(conflict.approved_at, locale)
                              : "—"}
                          </Row>
                        </dl>
                        <AccountCard account={conflict.user} />
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            <Separator />

            {/* --- Evidence --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.kycReviews.imagesHeading")}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {KYC_IMAGE_NAMES.map((name) => (
                  <KycImageTile
                    key={name}
                    verificationId={data.id}
                    name={name}
                  />
                ))}
              </div>
            </section>

            {/* --- Decision --- */}
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.kycReviews.decisionHeading")}
              </h3>
              {!isParked ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.kycReviews.alreadyDecided")}
                </p>
              ) : isSelf ? (
                <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <AlertTriangle
                    className="mt-px h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  <span>{t("admin.kycReviews.selfBlocked")}</span>
                </p>
              ) : (
                <div className="space-y-2">
                  {manualAttempt && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-foreground">
                        {t("admin.kycReviews.cardDetailsHeading")}
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor={`kyc-person-number-${data.id}`}>
                          {t("admin.kycReviews.inputIdNumber")}
                        </Label>
                        <Input
                          id={`kyc-person-number-${data.id}`}
                          inputMode="numeric"
                          autoComplete="off"
                          className="font-mono tabular-nums"
                          value={details.personNumber}
                          disabled={isPending}
                          aria-invalid={personNumberInvalid}
                          onChange={(event) =>
                            setDetail("personNumber", event.target.value)
                          }
                        />
                        {personNumberInvalid && (
                          <p className="text-[11px] text-destructive">
                            {t("admin.kycReviews.idNumberInvalid")}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`kyc-full-name-${data.id}`}>
                          {t("admin.kycReviews.inputFullName")}
                        </Label>
                        <Input
                          id={`kyc-full-name-${data.id}`}
                          autoComplete="off"
                          maxLength={120}
                          value={details.fullName}
                          disabled={isPending}
                          onChange={(event) =>
                            setDetail("fullName", event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`kyc-dob-${data.id}`}>
                          {t("admin.kycReviews.inputDateOfBirth")}
                        </Label>
                        <Input
                          id={`kyc-dob-${data.id}`}
                          autoComplete="off"
                          maxLength={20}
                          placeholder="DD/MM/YYYY"
                          value={details.dateOfBirth}
                          disabled={isPending}
                          onChange={(event) =>
                            setDetail("dateOfBirth", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                  <Textarea
                    id={`kyc-review-note-${data.id}`}
                    rows={3}
                    value={note}
                    disabled={isPending}
                    placeholder={
                      noteRequired
                        ? t("admin.kycReviews.notePlaceholder")
                        : t("admin.kycReviews.notePlaceholderOptional")
                    }
                    aria-label={
                      noteRequired
                        ? t("admin.kycReviews.notePlaceholder")
                        : t("admin.kycReviews.notePlaceholderOptional")
                    }
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
                      {t("admin.kycReviews.detailsRequired")}
                    </p>
                  )}
                  {noteRequired && noteMissing && (
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {t("admin.kycReviews.noteRequired")}
                    </p>
                  )}
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {t("admin.kycReviews.rejectHint")}
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

// The FundLok account behind an attempt: what a reviewer checks against the
// card (name, when it joined, whether it is still in good standing).
function AccountCard({ account }: { account: AdminKycAccountRef }) {
  const { t, locale } = useTranslations();
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl border border-border bg-muted/30 p-3 text-xs">
      <dt className="text-muted-foreground">
        {t("admin.kycReviews.fields.email")}
      </dt>
      <dd className="min-w-0 break-all text-foreground">{account.email}</dd>
      <dt className="text-muted-foreground">
        {t("admin.kycReviews.fields.accountStatus")}
      </dt>
      <dd>
        <Badge
          variant={account.status === "SUSPENDED" ? "destructive" : "secondary"}
        >
          {enumLabel(t, "userStatus", account.status)}
        </Badge>
      </dd>
      <dt className="text-muted-foreground">
        {t("admin.kycReviews.fields.joined")}
      </dt>
      <dd className="text-foreground">
        {account.created_at ? formatDate(account.created_at, locale) : "—"}
      </dd>
    </dl>
  );
}
