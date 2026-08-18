"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-authentication";
import { pageTransitionProps } from "@/lib/animations";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { DashboardHeader } from "../_components/DashboardHeader";
import { ActivityFeed } from "./_components/ActivityFeed";
import { ProtectionList } from "./_components/ProtectionList";
import { SecurityPostureCard } from "./_components/SecurityPostureCard";
import { SessionList } from "./_components/SessionList";
import {
  deriveScore,
  MOCK_ACTIVITY,
  MOCK_PROTECTIONS,
  MOCK_SESSIONS,
  type ProtectionItem,
} from "./_components/mock-security";

function SecuritySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_2fr] gap-4">
        <Skeleton className="h-[168px] w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-[168px] w-full rounded-xl" />
          <Skeleton className="h-[168px] w-full rounded-xl" />
          <Skeleton className="h-[168px] w-full rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-[420px] w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function SecurityClient() {
  const { isLoading: isAuthLoading } = useRequireAuth();
  const { locale, t } = useTranslations();

  // Local UI state only: toggling a protection or revoking a session is mock
  // behaviour with no endpoint behind it, so it never round-trips to React
  // Query. When the API lands this becomes a mutation + cache invalidation.
  const [protections, setProtections] =
    useState<ProtectionItem[]>(MOCK_PROTECTIONS);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const score = useMemo(() => deriveScore(protections), [protections]);
  const protectionsOn = protections.filter((p) => p.state === "on").length;

  const lastPasswordChange = useMemo(() => {
    const password = protections.find((p) => p.key === "password");
    return password?.updated_at
      ? formatDate(password.updated_at, locale)
      : t("common.unknown");
  }, [protections, locale, t]);

  const handleToggle = (key: string) =>
    setProtections((current) =>
      current.map((item) =>
        item.key === key && item.toggleable
          ? { ...item, state: item.state === "on" ? "off" : "on" }
          : item,
      ),
    );

  const handleRevoke = (id: string) =>
    setSessions((current) => current.filter((session) => session.id !== id));

  const handleRevokeAll = () =>
    setSessions((current) => current.filter((session) => session.current));

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <motion.div
        {...pageTransitionProps}
        className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard.security.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("dashboard.security.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold w-fit border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4" />
            <span>
              {t("dashboard.security.protectionsBadge", {
                on: protectionsOn,
                total: protections.length,
              })}
            </span>
          </div>
        </div>

        {/* Sample-data notice, same as the analytics and transactions screens:
            nothing here reflects the real account. */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t("dashboard.security.mockNotice")}
          </p>
        </div>

        {isAuthLoading ? (
          <SecuritySkeleton />
        ) : (
          <div className="space-y-6">
            <SecurityPostureCard
              score={score}
              protectionsOn={protectionsOn}
              protectionsTotal={protections.length}
              activeSessions={sessions.length}
              lastPasswordChange={lastPasswordChange}
            />

            <ProtectionList items={protections} onToggle={handleToggle} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SessionList
                sessions={sessions}
                onRevoke={handleRevoke}
                onRevokeAll={handleRevokeAll}
              />
              <ActivityFeed events={MOCK_ACTIVITY} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
