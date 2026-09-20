"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminProjectDetail,
  useDecideApplication,
  useResolveKybVerification,
} from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import type {
  AdminApplicationDocument,
  AdminDecision,
  AdminLoanApplication,
} from "@/services/admin.service";
import type { ApiError } from "@/lib/types";

// The admin project preview.
//
// A funding request needs TWO approvals before it can become a contract: the
// verification engine's (GVerify KYB) and an operator's. This panel shows both
// side by side so it is obvious WHICH one is missing, and lets the operator
// supply the half that is theirs to give.
//
// A Sheet rather than a Dialog: the content is a list that can run long, and a
// side panel keeps the table it was opened from in view.

interface ProjectPreviewSheetProps {
  projectId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ProjectPreviewSheet({
  projectId,
  onOpenChange,
}: ProjectPreviewSheetProps) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { data, isLoading } = useAdminProjectDetail(projectId);
  const { mutateAsync: resolveKyb, isPending: resolvingKyb } =
    useResolveKybVerification(projectId);
  const { mutateAsync: decide, isPending: deciding } =
    useDecideApplication(projectId);

  // One note box per decision target, keyed by record id — a rejection reason
  // typed against one application must not follow the operator to the next.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const noteFor = (id: string) => notes[id] ?? "";
  const setNote = (id: string, value: string) =>
    setNotes((prev) => ({ ...prev, [id]: value }));

  const fail = (err: unknown) =>
    toast({
      variant: "destructive",
      title: t("admin.preview.decisionFailed"),
      description: (err as ApiError)?.message ?? undefined,
    });

  const handleKyb = async (id: string, decision: AdminDecision) => {
    try {
      await resolveKyb({ id, body: { decision, note: noteFor(id) || null } });
      toast({ title: t("admin.preview.kybResolved") });
    } catch (err) {
      fail(err);
    }
  };

  const handleApplication = async (id: string, decision: AdminDecision) => {
    try {
      await decide({ id, body: { decision, note: noteFor(id) || null } });
      toast({ title: t("admin.preview.applicationDecided") });
    } catch (err) {
      fail(err);
    }
  };

  return (
    <Sheet open={projectId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {data?.legal_name ?? t("admin.preview.title")}
          </SheetTitle>
          <SheetDescription>{t("admin.preview.subtitle")}</SheetDescription>
        </SheetHeader>

        {isLoading || !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 px-4 pb-8">
            {/* --- The company, as it was registered --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.preview.companyHeading")}
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Row label={t("admin.table.status")}>
                  <Badge variant="secondary">{data.status}</Badge>
                </Row>
                <Row label={t("admin.table.industry")}>
                  {data.industry || "—"}
                </Row>
                <Row label={t("projectApplication.fields.taxId")}>
                  {data.tax_id || "—"}
                </Row>
                <Row label={t("projectApplication.fields.incorporationDate")}>
                  {data.incorporation_date
                    ? formatDate(data.incorporation_date, locale)
                    : "—"}
                </Row>
              </dl>
            </section>

            <Separator />

            {/* --- Half one: the verification engine --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.preview.engineHeading")}
              </h3>
              {!data.kyb ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.preview.noKyb")}
                </p>
              ) : (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={data.kyb.status} />
                    <span className="text-sm font-medium">
                      {data.kyb.status}
                    </span>
                  </div>
                  {data.kyb.rejection_reason && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {data.kyb.rejection_reason}
                    </p>
                  )}
                  {/* Only a parked attempt is an operator's to settle — an
                      APPROVED or REJECTED one is the provider's own verdict and
                      the API answers 409. */}
                  {data.kyb.status === "MANUAL_REVIEW" && (
                    <DecisionControls
                      note={noteFor(data.kyb.id)}
                      onNoteChange={(value) => setNote(data.kyb!.id, value)}
                      disabled={resolvingKyb}
                      onApprove={() => handleKyb(data.kyb!.id, "APPROVED")}
                      onReject={() => handleKyb(data.kyb!.id, "REJECTED")}
                      approveLabel={t("admin.preview.approve")}
                      rejectLabel={t("admin.preview.reject")}
                      notePlaceholder={t("admin.preview.notePlaceholder")}
                    />
                  )}
                </div>
              )}
            </section>

            <Separator />

            {/* --- Half two: the operator, per funding request --- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("admin.preview.applicationsHeading")}
              </h3>
              {data.applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.preview.noApplications")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.applications.map((application) => (
                    <li
                      key={application.id}
                      className="space-y-3 rounded-xl border border-border bg-muted/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(
                              application.requested_amount,
                              locale,
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {application.purpose || "—"}
                          </p>
                        </div>
                        <ApprovalBadge value={application.admin_approval} />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {t("admin.table.created")}:{" "}
                        {formatDate(application.created_at, locale)}
                      </p>

                      <DocumentList documents={application.documents} t={t} />

                      {application.decision_note && (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {application.decision_note}
                        </p>
                      )}

                      {/* One-way: a decided application answers 409, so the
                          controls retire once a verdict exists. */}
                      {application.admin_approval === "PENDING" && (
                        <DecisionControls
                          note={noteFor(application.id)}
                          onNoteChange={(value) =>
                            setNote(application.id, value)
                          }
                          disabled={deciding}
                          onApprove={() =>
                            handleApplication(application.id, "APPROVED")
                          }
                          onReject={() =>
                            handleApplication(application.id, "REJECTED")
                          }
                          approveLabel={t("admin.preview.approve")}
                          rejectLabel={t("admin.preview.reject")}
                          notePlaceholder={t("admin.preview.notePlaceholder")}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// The four uploads the SME wizard collects. Rendered from the backend's own
// document_type so a new type shows up as its raw key rather than vanishing —
// silently dropping a document an operator is meant to review would be worse
// than an unpolished label.
function DocumentList({
  documents,
  t,
}: {
  documents: AdminApplicationDocument[];
  t: (key: string) => string;
}) {
  if (documents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("admin.preview.noDocuments")}
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {documents.map((document) => {
        const label = t(
          `admin.preview.documentTypes.${document.document_type}`,
        );
        return (
          <li
            key={document.id}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="font-medium text-foreground">
              {/* An unmapped type falls back to the raw key rather than the
                  missing-key string. */}
              {label.startsWith("admin.preview.")
                ? document.document_type
                : label}
            </span>
            <span className="truncate">{document.original_filename}</span>
            {/* PENDING means the presign was issued but the object never
                landed — worth flagging, not hiding. */}
            {document.status !== "UPLOADED" && (
              <Badge variant="secondary" className="ml-auto shrink-0">
                {document.status}
              </Badge>
            )}
          </li>
        );
      })}
    </ul>
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
      <dd className="text-foreground">{children}</dd>
    </>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "APPROVED") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  }
  if (status === "REJECTED") {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }
  if (status === "MANUAL_REVIEW") {
    return <Clock className="h-4 w-4 text-amber-600" />;
  }
  return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
}

function ApprovalBadge({
  value,
}: {
  value: AdminLoanApplication["admin_approval"];
}) {
  if (value === "APPROVED") {
    return (
      <Badge className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        {value}
      </Badge>
    );
  }
  return (
    <Badge variant={value === "REJECTED" ? "destructive" : "secondary"}>
      {value}
    </Badge>
  );
}

interface DecisionControlsProps {
  note: string;
  onNoteChange: (value: string) => void;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
  approveLabel: string;
  rejectLabel: string;
  notePlaceholder: string;
}

function DecisionControls({
  note,
  onNoteChange,
  disabled,
  onApprove,
  onReject,
  approveLabel,
  rejectLabel,
  notePlaceholder,
}: DecisionControlsProps) {
  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        value={note}
        placeholder={notePlaceholder}
        disabled={disabled}
        onChange={(event) => onNoteChange(event.target.value)}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1"
          disabled={disabled}
          onClick={onApprove}
        >
          {disabled ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
          )}
          {approveLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={disabled}
          onClick={onReject}
        >
          <XCircle className="mr-2 h-3.5 w-3.5" />
          {rejectLabel}
        </Button>
      </div>
    </div>
  );
}
