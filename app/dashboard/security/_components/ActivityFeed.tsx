"use client";

import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ActivityEvent, ActivitySeverity } from "./mock-security";

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
  ActivitySeverity,
  { icon: typeof Info; dot: string; text: string }
>;

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
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
                  {t(
                    `dashboard.security.activity.events.${event.key}`,
                    event.params,
                  )}
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
                  <span>{formatDateTime(event.at, locale)}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
