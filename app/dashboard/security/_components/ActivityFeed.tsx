"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { enumLabel } from "@/lib/enum-labels";
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
  TOTP_ENABLED: "dashboard.security.activity.events.twoFactorEnabled",
  TOTP_DISABLED: "dashboard.security.activity.events.twoFactorDisabled",
  PASSKEY_ADDED: "dashboard.security.activity.events.passkeyAdded",
  PASSKEY_REMOVED: "dashboard.security.activity.events.passkeyRemoved",
  PASSWORD_SET: "dashboard.security.activity.events.passwordSet",
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
        : t("dashboard.security.activity.bankAccountFallback");

  const count = typeof details.count === "number" ? details.count : 1;

  return { device, location, bank, count };
}

function actionLabel(
  event: SecurityEvent,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const key = ACTION_KEYS[event.action];
  if (!key) {
    // Not a security event we word ourselves: use the shared audit-action
    // label, which falls back to a readable form of the code.
    return enumLabel(t, "auditAction", event.action);
  }
  const context = getEventContext(event, t);
  return t(key, context);
}

const DEFAULT_INITIAL_ACTIVITIES = 7;

export function ActivityFeed({
  events,
  hasMore = false,
  isLoadingMore = false,
  onFetchMore,
  onCollapse,
  initialCount = DEFAULT_INITIAL_ACTIVITIES,
}: {
  events: SecurityEvent[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onFetchMore?: () => void;
  onCollapse?: () => void;
  initialCount?: number;
}) {
  const { locale, t } = useTranslations();
  const [visibleCount, setVisibleCount] = useState(initialCount);

  // If onFetchMore is supplied, parent manages fetched events size.
  // Otherwise, fall back to slicing the local events array.
  const isServerManaged = Boolean(onFetchMore);
  const visibleEvents = isServerManaged
    ? events
    : events.slice(0, visibleCount);
  const activeHasMore = isServerManaged
    ? hasMore
    : events.length > visibleCount;
  const activeCanCollapse = isServerManaged
    ? events.length > initialCount && Boolean(onCollapse)
    : visibleCount > initialCount && events.length > initialCount;

  const handleFetchMore = () => {
    if (onFetchMore) {
      onFetchMore();
    } else {
      setVisibleCount((prev) => prev + initialCount);
    }
  };

  const handleCollapse = () => {
    if (onCollapse) {
      onCollapse();
    } else {
      setVisibleCount(initialCount);
    }
  };

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

      {visibleEvents.length === 0 ? (
        <div className="border-t border-border pt-6 pb-2 text-center">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.security.activity.empty")}
          </p>
        </div>
      ) : (
        <ol className="border-t border-border pt-4">
          {visibleEvents.map((event, index) => {
            const severity = SEVERITY[event.severity];
            const Icon = severity.icon;
            const isLast = index === visibleEvents.length - 1;

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
      )}

      {(activeHasMore || activeCanCollapse) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-border mt-3">
          <span className="text-xs text-muted-foreground">
            {t("dashboard.security.activity.showingCount", {
              shown: visibleEvents.length,
            })}
          </span>
          <div className="flex items-center gap-2">
            {activeHasMore && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoadingMore}
                onClick={handleFetchMore}
                className="text-xs font-medium hover:bg-muted"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    {t("dashboard.security.activity.loadingMore")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                    {t("dashboard.security.activity.showMore")}
                  </>
                )}
              </Button>
            )}
            {activeCanCollapse && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoadingMore}
                onClick={handleCollapse}
                className="text-xs font-medium hover:bg-muted"
              >
                <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                {t("dashboard.security.activity.showLess")}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
