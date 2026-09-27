"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Play,
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
import { cn } from "@/lib/utils";
import { DocumentViewerDialog } from "./DocumentViewerDialog";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminProjectDetail,
  useDecideApplication,
  useResolveKybVerification,
} from "@/hooks/use-admin";
import { useStartScoreRun } from "@/hooks/use-underwriting";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import { industryLabel } from "@/lib/industry-label";
import type {
  AdminApplicationDocument,
  AdminScoreRun,
  AdminDecision,
  AdminLoanApplication,
} from "@/services/admin.service";
import { apiErrorMessage } from "@/lib/api-error-message";

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

  // Which document the viewer dialog is showing; null = closed.
  const [viewerDocument, setViewerDocument] =
    useState<AdminApplicationDocument | null>(null);
  // One note box per decision target, keyed by record id — a rejection reason
  // typed against one application must not follow the operator to the next.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const noteFor = (id: string) => notes[id] ?? "";
  const setNote = (id: string, value: string) =>
    setNotes((prev) => ({ ...prev, [id]: value }));

  // Which application is being scored; null = none. Tracked by id rather than
  // a bare boolean so one request's spinner cannot appear on another's row.
  const [scoringId, setScoringId] = useState<string | null>(null);
  const { mutateAsync: startScoreRun } = useStartScoreRun(projectId);

  const handleScore = async (applicationId: string) => {
    setScoringId(applicationId);
    try {
      const run = await startScoreRun({ application_id: applicationId });
      // INSUFFICIENT_DATA and AI_PENDING are answers, not failures — the
      // engine declining for want of inputs is information the operator needs,
      // so it is reported neutrally rather than as an error.
      const inconclusive =
        run.decision === "INSUFFICIENT_DATA" || run.decision === "AI_PENDING";
      toast({
        title: inconclusive
          ? t("admin.preview.scoreInconclusive")
          : t("admin.preview.scoreComplete"),
        description: inconclusive ? String(run.decision) : undefined,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.preview.scoreFailed"),
        description: apiErrorMessage(err, locale, t("common.tryAgain")),
      });
    } finally {
      setScoringId(null);
    }
  };

  const fail = (err: unknown) =>
    toast({
      variant: "destructive",
      title: t("admin.preview.decisionFailed"),
      description: apiErrorMessage(err, locale, t("common.tryAgain")),
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
                  <Badge variant="secondary">
                    {enumLabel(t, "projectStatus", data.status)}
                  </Badge>
                </Row>
                <Row label={t("admin.table.industry")}>
                  {industryLabel(data.industry, t) || "—"}
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
                      {enumLabel(t, "verificationStatus", data.kyb.status)}
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
                        <ApprovalBadge
                          value={application.admin_approval}
                          t={t}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {t("admin.table.created")}:{" "}
                        {formatDate(application.created_at, locale)}
                      </p>

                      {/* The engine's answer, before the operator gives
                          theirs — the whole point of previewing. */}
                      <ScoreRunSummary
                        run={application.score_run}
                        t={t}
                        // Scoring needs a submitted application: the engine
                        // would otherwise grade figures the SME has not
                        // finished entering, and the API answers 400. The
                        // first run moves it to UNDER_REVIEW; it can be run
                        // again until the request is decided (the API answers
                        // 409 after that, and for a locked run).
                        canRun={
                          application.status === "SUBMITTED" ||
                          (application.status === "UNDER_REVIEW" &&
                            application.admin_approval === "PENDING")
                        }
                        running={scoringId === application.id}
                        onRun={() => handleScore(application.id)}
                      />

                      <DocumentList
                        documents={application.documents}
                        t={t}
                        onOpen={setViewerDocument}
                      />

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

      <DocumentViewerDialog
        document={viewerDocument}
        onOpenChange={(open) => {
          if (!open) setViewerDocument(null);
        }}
      />
    </Sheet>
  );
}

// The four uploads the SME wizard collects. Rendered from the backend's own
// document_type so a new type shows up as its raw key rather than vanishing —
// silently dropping a document an operator is meant to review would be worse
// than an unpolished label.
// The grading engine's result for one funding request.
//
// Shows BOTH the run lifecycle and the decision: a LOCKED run that decided
// REVIEW is not an approval, and collapsing them would read as one. The grade
// is a 0-100 internal assessment — a reference input to the operator's
// decision, never a rating, so it is labelled as a score and never graded to a
// letter.
function ScoreRunSummary({
  run,
  t,
  canRun,
  running,
  onRun,
}: {
  run: AdminScoreRun | null;
  t: (key: string) => string;
  canRun: boolean;
  running: boolean;
  onRun: () => void;
}) {
  const runButton = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="w-full"
      disabled={!canRun || running}
      onClick={onRun}
    >
      {running ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Play className="mr-2 h-3.5 w-3.5" />
      )}
      {run ? t("admin.preview.rescore") : t("admin.preview.runScoring")}
    </Button>
  );

  if (!run) {
    // No run means no opinion. Rendering a zero would invent one.
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {canRun
            ? t("admin.preview.noScoreRun")
            : t("admin.preview.scoreNeedsSubmitted")}
        </p>
        {canRun && runButton}
      </div>
    );
  }
  // REJECT is a verdict; INSUFFICIENT_DATA and AI_PENDING are the engine
  // saying it has no verdict. All three are red because all three mean there
  // is no score behind the Approve button sitting directly below — and a grey
  // badge next to two em-dashes reads, at a glance, like a score that simply
  // has not loaded yet.
  const noVerdict =
    run.decision === "INSUFFICIENT_DATA" || run.decision === "AI_PENDING";
  const blocked = noVerdict || run.decision === "REJECT";

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border bg-background/60 p-3",
        blocked ? "border-destructive/50" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          {t("admin.preview.scoreHeading")}
        </span>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary">
            {enumLabel(t, "scoreRunStatus", run.status)}
          </Badge>
          {run.decision && (
            <Badge variant={blocked ? "destructive" : "secondary"}>
              {enumLabel(t, "scoreDecision", run.decision)}
            </Badge>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">
          {t("admin.preview.scoreGrade")}
        </dt>
        <dd className="tabular-nums text-foreground">
          {run.final_grade === null ? "—" : run.final_grade.toFixed(2)}
        </dd>
        <dt className="text-muted-foreground">
          {t("admin.preview.scoreRate")}
        </dt>
        <dd className="tabular-nums text-foreground">
          {run.interest_rate_pct === null
            ? "—"
            : `${run.interest_rate_pct.toFixed(2)}%`}
        </dd>
      </dl>
      {/* The two em-dashes above are the whole story otherwise. Say what is
          absent and what approving anyway would mean, because the Approve
          button is the next thing on the panel. */}
      {noVerdict && (
        <p className="text-[11px] leading-relaxed text-destructive">
          {run.decision === "AI_PENDING"
            ? t("admin.preview.scoreAiPendingHint")
            : t("admin.preview.scoreInsufficientHint")}
        </p>
      )}
      {/* Which inputs, by name — "missing financial inputs" alone left the
          operator re-running a score that could not change. */}
      {run.decision === "INSUFFICIENT_DATA" &&
        (run.missing_inputs?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-destructive">
              {t("admin.preview.missingInputs")}
            </p>
            <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-destructive">
              {run.missing_inputs!.map((key) => {
                const label = t(`admin.preview.missingInput.${key}`);
                return (
                  <li key={key}>
                    {label === `admin.preview.missingInput.${key}`
                      ? key
                      : label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      {/* Provenance: which engine and parameter set produced this, so a quote
          stays traceable after either is bumped. */}
      {(run.engine_version || run.params_version) && (
        <p className="font-mono text-[11px] text-muted-foreground">
          {run.engine_version} · {run.params_version}
        </p>
      )}
      {/* A LOCKED run is the basis a contract gets created on, so it is not
          re-run from here — a new one would leave which run backed the
          decision ambiguous. */}
      {run.status !== "LOCKED" && canRun && runButton}
    </div>
  );
}

function DocumentList({
  documents,
  t,
  onOpen,
}: {
  documents: AdminApplicationDocument[];
  t: (key: string) => string;
  onOpen: (document: AdminApplicationDocument) => void;
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
        // Only a confirmed upload can be opened — there is no object behind a
        // PENDING row, so it stays inert rather than offering a dead link.
        const openable = document.status === "UPLOADED";
        return (
          <li key={document.id}>
            <button
              type="button"
              disabled={!openable}
              onClick={() => onOpen(document)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs text-muted-foreground",
                openable
                  ? "cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : "cursor-default",
              )}
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
              {!openable && (
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {enumLabel(t, "documentStatus", document.status)}
                </Badge>
              )}
            </button>
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
  t,
}: {
  value: AdminLoanApplication["admin_approval"];
  t: (key: string) => string;
}) {
  const label = enumLabel(t, "approval", value);
  if (value === "APPROVED") {
    return (
      <Badge className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant={value === "REJECTED" ? "destructive" : "secondary"}>
      {label}
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
