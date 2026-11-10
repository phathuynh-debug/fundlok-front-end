"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCheckDocumentSignature } from "@/hooks/use-admin";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type {
  AdminApplicationDocument,
  AdminSignatureCheck,
} from "@/services/admin.service";

// The SME's signed Service Agreement (loan wizard step 4), as NEAC
// (neac.gov.vn) sees it, under its row in the project panel.
//
// Three separate answers, because each can fail on its own: NEAC's verdict on
// the signature, whether the file is the agreement FundLok issued for this
// application, and whether the signer's tax code is the company's. A charter
// signed by the company passes the first and third and fails the second; the
// right agreement signed by someone else's certificate fails the third.
//
// It runs by itself the first time anyone opens an application whose
// agreement has not been checked, and on demand after that. The SME was not
// held up by it: the wizard only requires a signature to be present.

type Mark = "ok" | "fail" | "unknown";

interface NeacCheckPanelProps {
  document: AdminApplicationDocument;
  projectId: string | null;
  locale: string;
  t: (key: string) => string;
}

export function NeacCheckPanel({
  document,
  projectId,
  locale,
  t,
}: NeacCheckPanelProps) {
  const check = useCheckDocumentSignature(projectId);
  const { mutate } = check;
  const stored = document.signature_check ?? null;
  const checkable = document.status === "UPLOADED";

  // Once per mount: a failed request must not turn into a loop, and React's
  // dev double-mount keeps the ref.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !checkable || stored) return;
    autoRan.current = true;
    mutate(document.id);
  }, [checkable, stored, document.id, mutate]);

  const result = newest(check.data, stored);
  const tr = (key: string, vars: Record<string, string> = {}) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, value),
      t(`admin.preview.neac.${key}`),
    );

  if (!checkable) return null;

  return (
    <div
      data-testid="neac-check"
      className="ml-5 mt-1 space-y-2 rounded-md border bg-muted/30 p-2.5 text-xs"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="font-medium text-foreground">{tr("title")}</span>
        {result && !check.isPending && <OverallBadge result={result} tr={tr} />}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-auto h-7 px-2 text-xs"
          disabled={check.isPending}
          onClick={() => mutate(document.id)}
        >
          {check.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          )}
          {result ? tr("recheck") : tr("check")}
        </Button>
      </div>

      {check.isPending && (
        <p className="text-muted-foreground" role="status">
          {tr("checking")}
        </p>
      )}

      {check.isError && !check.isPending && (
        <p className="text-destructive" role="alert">
          {tr("failed")}{" "}
          {apiErrorMessage(check.error, locale, t("common.tryAgain"))}
        </p>
      )}

      {result && !check.isPending && (
        <CheckDetails result={result} locale={locale} tr={tr} />
      )}
    </div>
  );
}

function CheckDetails({
  result,
  locale,
  tr,
}: {
  result: AdminSignatureCheck;
  locale: string;
  tr: (key: string, vars?: Record<string, string>) => string;
}) {
  const taxCode = result.expected_tax_code ?? "—";
  const signerMark = signerOf(result);
  const signerText =
    signerMark === "ok"
      ? tr("signerMatches", { taxCode })
      : signerMark === "fail"
        ? tr("signerMismatch", { taxCode, signerId: result.signer_id ?? "—" })
        : tr("signerUnknown", { taxCode });
  const revocation = withoutUrl(result.ocsp ?? result.crl);

  return (
    <>
      <ul className="space-y-1">
        <CheckItem mark={signatureOf(result)}>
          {tr(`signature.${result.status}`)}
        </CheckItem>
        <CheckItem mark={result.right_document ? "ok" : "fail"}>
          {tr(result.right_document ? "rightDocument" : "wrongDocument", {
            ref: result.application_ref,
            version: result.agreement_version,
          })}
        </CheckItem>
        <CheckItem mark={signerMark}>
          {signerText}{" "}
          {result.expected_source && (
            <span className="text-muted-foreground">
              ({tr(`source.${result.expected_source}`)})
            </span>
          )}
        </CheckItem>
        {result.guarantor_required && (
          <CheckItem mark={guarantorOf(result)}>
            {guarantorText(result, tr)}
          </CheckItem>
        )}
        {typeof result.terms_match === "boolean" && (
          <CheckItem mark={result.terms_match ? "ok" : "fail"}>
            {tr(result.terms_match ? "termsMatch" : "termsMismatch", {
              code: result.check_code ?? "—",
            })}
          </CheckItem>
        )}
        {result.terms_match === null && result.check_code && (
          <CheckItem mark="unknown">{tr("termsNoCode")}</CheckItem>
        )}
      </ul>

      {result.signer_name && !result.name_matches && (
        <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {tr("nameMismatch", { name: result.expected_name ?? "—" })}
        </p>
      )}

      {result.guarantor_required &&
        result.guarantor_name &&
        !result.guarantor_name_matches && (
          <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            {tr("guarantorNameMismatch", {
              name: result.guarantor_expected_name ?? "—",
            })}
          </p>
        )}

      {result.problems.length > 0 && (
        <div className="space-y-0.5 text-destructive">
          <p className="font-medium">{tr("problemsHeading")}</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {result.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {result.signer_name && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          <Field label={tr("fields.signer")}>
            {result.signer_name}
            {result.signer_id && (
              <span className="text-muted-foreground">
                {" "}
                · {result.signer_id}
              </span>
            )}
          </Field>
          <Field label={tr("fields.issuer")}>{result.issuer_name}</Field>
          <Field label={tr("fields.signedTime")}>{result.signed_time}</Field>
          <Field label={tr("fields.validity")}>
            {result.certificate_validity}
          </Field>
          <Field label={tr("fields.revocation")}>{revocation}</Field>
          {result.guarantor_required && result.guarantor_name && (
            <Field label={tr("fields.guarantor")}>
              {result.guarantor_name}
              {result.guarantor_id && (
                <span className="text-muted-foreground">
                  {" "}
                  · {result.guarantor_id}
                </span>
              )}
            </Field>
          )}
        </dl>
      )}

      {(result.guarantor_problems?.length ?? 0) > 0 && (
        <div className="space-y-0.5 text-destructive">
          <p className="font-medium">{tr("guarantorProblemsHeading")}</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {result.guarantor_problems!.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {tr("checkedAt", { time: formatDateTime(result.checked_at, locale) })}
      </p>
    </>
  );
}

function OverallBadge({
  result,
  tr,
}: {
  result: AdminSignatureCheck;
  tr: (key: string) => string;
}) {
  const overall = overallOf(result);
  return (
    <Badge
      variant={overall === "review" ? "destructive" : "outline"}
      className={cn(
        overall === "verified" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        overall === "unavailable" &&
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {tr(`overall.${overall}`)}
    </Badge>
  );
}

function CheckItem({
  mark,
  children,
}: {
  mark: Mark;
  children: React.ReactNode;
}) {
  return (
    <li data-mark={mark} className="flex items-start gap-1.5 text-foreground">
      {mark === "ok" && (
        <CheckCircle2
          className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
      )}
      {mark === "fail" && (
        <XCircle
          className="mt-px h-3.5 w-3.5 shrink-0 text-destructive"
          aria-hidden
        />
      )}
      {mark === "unknown" && (
        <Clock
          className="mt-px h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
      <span>{children}</span>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children ?? "—"}</dd>
    </>
  );
}

function signatureOf(result: AdminSignatureCheck): Mark {
  if (result.status === "VERIFIED") return "ok";
  if (result.status === "UNAVAILABLE") return "unknown";
  return "fail";
}

// Only a signature NEAC could read has a signer to compare.
function signerOf(result: AdminSignatureCheck): Mark {
  if (!result.signer_id) return "unknown";
  return result.signer_matches ? "ok" : "fail";
}

// The Standing Offer's second signer. Unknown until NEAC has answered.
function guarantorOf(result: AdminSignatureCheck): Mark {
  if (result.status === "UNAVAILABLE") return "unknown";
  return result.guarantor_matches ? "ok" : "fail";
}

function guarantorText(
  result: AdminSignatureCheck,
  tr: (key: string, vars?: Record<string, string>) => string,
): string {
  const id = result.guarantor_expected_id ?? "—";
  if (!result.guarantor_expected_id) return tr("guarantorUnverified");
  if (result.status === "UNAVAILABLE") return tr("guarantorUnknown", { id });
  return result.guarantor_matches
    ? tr("guarantorMatches", { id })
    : tr("guarantorMissing", { id });
}

function overallOf(
  result: AdminSignatureCheck,
): "verified" | "review" | "unavailable" {
  if (result.status === "UNAVAILABLE") return "unavailable";
  const allOk =
    result.status === "VERIFIED" &&
    result.right_document &&
    result.signer_matches &&
    (!result.guarantor_required || result.guarantor_matches === true) &&
    result.terms_match !== false;
  return allOk ? "verified" : "review";
}

// The one just run, unless the panel already has a newer one (another admin).
function newest(
  a: AdminSignatureCheck | undefined,
  b: AdminSignatureCheck | null,
): AdminSignatureCheck | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a.checked_at) >= Date.parse(b.checked_at) ? a : b;
}

// NEAC appends the responder's URL in brackets; the sentence is what matters.
function withoutUrl(value: string | null): string | null {
  return value ? value.replace(/\s*\[[^\]]*\]\s*$/, "") : null;
}
