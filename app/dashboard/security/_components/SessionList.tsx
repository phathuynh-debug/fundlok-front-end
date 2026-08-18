"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Laptop, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DeviceSession } from "./mock-security";

export function SessionList({
  sessions,
  onRevoke,
  onRevokeAll,
}: {
  sessions: DeviceSession[];
  onRevoke: (id: string) => void;
  onRevokeAll: () => void;
}) {
  const { locale, t } = useTranslations();
  const revocable = sessions.filter((session) => !session.current).length;

  return (
    <Card className="p-5 md:p-6 gap-0">
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {t("dashboard.security.sessions.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.security.sessions.subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={revocable === 0}
          onClick={onRevokeAll}
          className="shrink-0"
        >
          {t("dashboard.security.sessions.revokeAll")}
        </Button>
      </div>

      <ul className="divide-y divide-border border-t border-border">
        <AnimatePresence initial={false}>
          {sessions.map((session) => (
            <motion.li
              key={session.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 overflow-hidden py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    session.unrecognized
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {session.unrecognized ? (
                    <AlertTriangle className="h-[18px] w-[18px]" />
                  ) : (
                    <Laptop className="h-[18px] w-[18px]" />
                  )}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {session.device} · {session.browser}
                    </span>
                    {session.current && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        {t("dashboard.security.sessions.thisDevice")}
                      </Badge>
                    )}
                    {session.unrecognized && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-destructive/20 bg-destructive/10 px-2 text-[11px] font-semibold text-destructive"
                      >
                        {t("dashboard.security.sessions.unrecognized")}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{session.location}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{session.ip}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("dashboard.security.sessions.lastActive", {
                      when: formatDateTime(session.last_active, locale),
                    })}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={session.current}
                onClick={() => onRevoke(session.id)}
                className="shrink-0 sm:w-32"
              >
                {t(
                  session.current
                    ? "dashboard.security.sessions.currentAction"
                    : "dashboard.security.sessions.revoke",
                )}
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {revocable === 0 && (
        <p className="pt-4 text-sm text-muted-foreground">
          {t("dashboard.security.sessions.onlyThisDevice")}
        </p>
      )}
    </Card>
  );
}
