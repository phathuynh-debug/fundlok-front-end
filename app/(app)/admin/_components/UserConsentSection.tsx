import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type {
  AdminConsentRecord,
  AdminUserConsent,
} from "@/services/admin.service";

// The user panel's "Terms & data consent" section: whether the user accepted
// the current Terms & Services and data consent (Contract 1), and every
// acceptance record as stored: version, the three boxes, how it was
// confirmed, IP and device. Read-only; records are never edited.

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

// The three boxes, in the order the sign-up screen shows them.
const BOXES = [
  { key: "TERMS", label: "admin.consent.boxTerms" },
  { key: "DATA_PROCESSING", label: "admin.consent.boxDataProcessing" },
  { key: "DATA_SHARING_TPV", label: "admin.consent.boxDataSharing" },
] as const;

export function UserConsentSection({
  consent,
  locale,
  t,
}: {
  consent: AdminUserConsent;
  locale: string;
  t: TranslateFn;
}) {
  const [latest, ...older] = consent.records;

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileCheck2 className="h-4 w-4 text-primary" aria-hidden />
        {t("admin.consent.title")}
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 rounded-lg border bg-muted/20 p-3">
          <span className="block text-xs text-muted-foreground">
            {t("admin.consent.status")}
          </span>
          <StatusBadge status={consent.status} t={t} />
        </div>
        <div className="space-y-1.5 rounded-lg border bg-muted/20 p-3">
          <span className="block text-xs text-muted-foreground">
            {t("admin.consent.currentVersion")}
          </span>
          <span className="block font-mono text-xs text-foreground">
            {consent.current_version}
          </span>
          {consent.accepted_at && (
            <span className="block text-xs text-muted-foreground">
              {t("admin.consent.acceptedOn", {
                date: formatDateTime(consent.accepted_at, locale),
              })}
            </span>
          )}
        </div>
      </div>

      {consent.status === "NOT_APPLICABLE" ? (
        <p className="text-xs text-muted-foreground">
          {t("admin.consent.notApplicableHelp")}
        </p>
      ) : latest ? (
        <>
          <ConsentRecord record={latest} locale={locale} t={t} highlight />
          {older.length > 0 && (
            <div className="space-y-2">
              <span className="block text-xs font-medium text-muted-foreground">
                {t("admin.consent.earlierRecords", { count: older.length })}
              </span>
              {older.map((record) => (
                <ConsentRecord
                  key={record.id}
                  record={record}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("admin.consent.noRecords")}
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: AdminUserConsent["status"];
  t: TranslateFn;
}) {
  if (status === "NOT_APPLICABLE") {
    return (
      <Badge variant="secondary" className="text-xs">
        {t("admin.consent.notApplicable")}
      </Badge>
    );
  }
  return status === "ACCEPTED" ? (
    <Badge className="gap-1 bg-emerald-600 text-xs hover:bg-emerald-600">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      {t("admin.consent.accepted")}
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400"
    >
      {t("admin.consent.required")}
    </Badge>
  );
}

function ConsentRecord({
  record,
  locale,
  t,
  highlight = false,
}: {
  record: AdminConsentRecord;
  locale: string;
  t: TranslateFn;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-2.5 rounded-lg border p-3",
        highlight ? "bg-card" : "bg-muted/20",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono text-foreground">{record.version}</span>
        <span className="text-muted-foreground">
          {formatDateTime(record.created_at, locale)}
        </span>
      </div>

      <ul className="space-y-1.5">
        {BOXES.map((box) => {
          const ticked = record.consents[box.key] === true;
          return (
            <li key={box.key} className="flex items-start gap-2 text-xs">
              {ticked ? (
                <CheckCircle2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label={t("admin.consent.ticked")}
                />
              ) : (
                <XCircle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive"
                  aria-label={t("admin.consent.notTicked")}
                />
              )}
              <span className={ticked ? "text-foreground" : "text-muted-foreground"}>
                {t(box.label)}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">{t("admin.consent.verifiedBy")}</dt>
        <dd className="text-foreground">
          {record.verified_by === "EMAIL_OTP"
            ? t("admin.consent.emailOtp")
            : record.verified_by}
        </dd>
        <dt className="text-muted-foreground">{t("admin.consent.ipAddress")}</dt>
        <dd className="font-mono text-foreground">{record.ip_address ?? "—"}</dd>
        <dt className="text-muted-foreground">{t("admin.consent.device")}</dt>
        <dd className="break-all text-foreground">{record.user_agent ?? "—"}</dd>
      </dl>
    </div>
  );
}
