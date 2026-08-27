"use client";

import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  SecurityEvent,
  SecurityEventSeverity,
} from "@/services/authentication.service";

const SEVERITY = {
  info: { icon: Info, dot: "bg-muted-foreground/40", text: "text-foreground" },
  warning: {
    icon: AlertTriangle,
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  critical: {
    icon: ShieldAlert,
    dot: "bg-destructive",
    text: "text-destructive",
  },
} satisfies Record<
  SecurityEventSeverity,
  { icon: typeof Info; dot: string; text: string }
>;

const ACTION_KEYS: Record<string, string> = {
  SIGN_IN: "dashboard.security.activity.events.signIn",
  LOGIN: "dashboard.security.activity.events.signIn",
  SIGN_IN_FAILED: "dashboard.security.activity.events.failedAttempt",
  FAILED_ATTEMPT: "dashboard.security.activity.events.failedAttempt",
  LOGIN_FAILED: "dashboard.security.activity.events.failedAttempt",
  NEW_DEVICE: "dashboard.security.activity.events.newDevice",
  SESSION_REVOKED: "dashboard.security.activity.events.sessionRevoked",
  SESSIONS_REVOKED_OTHERS:
    "dashboard.security.activity.events.sessionsRevokedOthers",
  REVOKE_ALL_SESSIONS:
    "dashboard.security.activity.events.sessionsRevokedOthers",
  PASSWORD_RESET: "dashboard.security.activity.events.passwordChanged",
  PASSWORD_CHANGED: "dashboard.security.activity.events.passwordChanged",
  SIGNIN_ALERTS_CHANGED:
    "dashboard.security.activity.events.signInAlertsChanged",
  SIGN_IN_ALERTS_CHANGED:
    "dashboard.security.activity.events.signInAlertsChanged",
  LOGIN_ALERTS_CHANGED:
    "dashboard.security.activity.events.signInAlertsChanged",
  LOGIN_ALERTS_TOGGLED:
    "dashboard.security.activity.events.signInAlertsChanged",
  PAYOUT_ACCOUNT_ADDED: "dashboard.security.activity.events.payoutAccountAdded",
  PAYOUT_ACCOUNT_CHANGED:
    "dashboard.security.activity.events.payoutAccountAdded",
  TWO_FACTOR_ENABLED: "dashboard.security.activity.events.twoFactorEnabled",
};

function getEventContext(
  event: SecurityEvent,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const details = (event.details || event.metadata || {}) as Record<
    string,
    unknown
  >;

  const rawDevice =
    event.device ||
    (typeof details.device === "string" ? details.device : null) ||
    (typeof details.user_agent === "string" ? details.user_agent : null) ||
    (typeof details.browser === "string" ? details.browser : null);

  const rawLocation =
    event.location ||
    (typeof details.location === "string" ? details.location : null) ||
    (typeof details.city === "string" ? details.city : null);

  const device = rawDevice || t("dashboard.security.activity.unknownDevice");

  const location =
    rawLocation ||
    (event.ip_address
      ? `IP ${event.ip_address}`
      : t("dashboard.security.activity.unknownLocation"));

  const bank =
    typeof details.bank === "string"
      ? details.bank
      : typeof details.bank_name === "string"
        ? details.bank_name
        : "Bank Account";

  const count = typeof details.count === "number" ? details.count : 1;

  return { device, location, bank, count };
}

function actionLabel(
  event: SecurityEvent,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const key = ACTION_KEYS[event.action];
  if (!key) {
    return event.action.replace(/_/g, " ");
  }
  const context = getEventContext(event, t);
  return t(key, context);
}

export function ActivityFeed({ events }: { events: SecurityEvent[] }) {
  const { locale, t } = useTranslations();

  return (
    <Card className="p-5 md:p-6 gap-0">
      <div className="flex flex-col gap-1 pb-4">
        <h2 className="text-base font-semibold text-foreground">
          {t("dashboard.security.activity.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.security.activity.subtitle")}
        </p>
      </div>

      <ol className="border-t border-border pt-4">
        {events.map((event, index) => {
          const severity = SEVERITY[event.severity];
          const Icon = severity.icon;
          const isLast = index === events.length - 1;

          return (
            <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
              {/* Timeline spine */}
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
                />
              )}

              <span
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card",
                  severity.text,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0 pt-1">
                <p className="text-sm text-foreground">
                  {/* Action codes come from the audit log. An action with no
                      translation falls back to the code itself rather than
                      rendering a raw i18n key at the user. */}
                  {actionLabel(event, t)}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", severity.dot)}
                  />
                  <span>
                    {t(
                      `dashboard.security.activity.severity.${event.severity}`,
                    )}
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    {event.created_at
                      ? formatDateTime(event.created_at, locale)
                      : ""}
                  </span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
