"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRequireAuth,
  useRevokeOtherSessions,
  useRevokeSession,
  useSecurityEvents,
  useSecurityPreferences,
  useSessions,
  useTwoFactorStatus,
  useUpdateSecurityPreferences,
} from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { ActivityFeed } from "./ActivityFeed";
import { ProtectionList } from "./ProtectionList";
import { SecurityPostureCard } from "./SecurityPostureCard";
import { SessionList } from "./SessionList";
import { buildProtections, deriveScore } from "./protections";
import { usePasskeys } from "@/hooks/use-authentication";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { TwoFactorDisableDialog } from "./TwoFactorDisableDialog";
import { TwoFactorSetupDialog } from "./TwoFactorSetupDialog";
import { PasskeyDialog } from "./PasskeyDialog";
import { apiErrorMessage } from "@/lib/api-error-message";

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

/**
 * The whole security body — posture card, protections, sessions, activity and
 * the four dialogs — shared by /dashboard/security and /admin/security. The
 * route client supplies its own chrome (header, page transition) and can
 * retitle the screen; everything else is identical because admins are users
 * and the same /auth + /users/me endpoints serve both.
 */
export function SecuritySettings({
  titleKey = "dashboard.security.title",
  subtitleKey = "dashboard.security.subtitle",
}: {
  titleKey?: string;
  subtitleKey?: string;
}) {
  const { isLoading: isAuthLoading } = useRequireAuth();
  const { locale, t } = useTranslations();
  const { toast } = useToast();

  // Sessions and activity are real server state: /auth/sessions is backed by
  // refresh_tokens and /auth/security-events by audit_logs, so they belong in
  // React Query, keyed by authKeys.
  const { data: sessions = [], isLoading: isSessionsLoading } =
    useSessions(!isAuthLoading);
  const { data: activity = [], isLoading: isActivityLoading } =
    useSecurityEvents(!isAuthLoading);
  const {
    mutate: revokeSession,
    isPending: isRevoking,
    variables: revokingId,
  } = useRevokeSession();
  const { mutate: revokeOthers, isPending: isRevokingAll } =
    useRevokeOtherSessions();

  // Sign-in alerts are a real preference; the password row opens a dialog.
  // 2FA and passkeys are both real now, so buildProtections marks them
  // unavailable rather than pretending they are on.
  const { data: preferences, isLoading: isPrefsLoading } =
    useSecurityPreferences(!isAuthLoading);
  const { mutate: updatePreferences, isPending: isSavingPreference } =
    useUpdateSecurityPreferences();
  const { data: twoFactor, isLoading: isTwoFactorLoading } =
    useTwoFactorStatus(!isAuthLoading);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [totpSetupOpen, setTotpSetupOpen] = useState(false);
  const [totpDisableOpen, setTotpDisableOpen] = useState(false);
  const [passkeyDialogOpen, setPasskeyDialogOpen] = useState(false);

  const { data: passkeys } = usePasskeys();

  const protections = useMemo(
    () =>
      buildProtections(
        preferences?.signin_alerts_enabled ?? false,
        twoFactor?.enabled ?? false,
        passkeys?.length ?? 0,
      ),
    [preferences?.signin_alerts_enabled, twoFactor?.enabled, passkeys?.length],
  );

  const score = useMemo(() => deriveScore(protections), [protections]);
  const protectionsOn = protections.filter((p) => p.state === "on").length;

  // The password row no longer carries a date: nothing stores when a password
  // last changed. The security history does show PASSWORD_CHANGED events, which
  // is the honest answer to "when did I change it".
  const lastPasswordChange = useMemo(() => {
    const changed = activity.find(
      (event) => event.action === "PASSWORD_CHANGED",
    );
    return changed?.created_at
      ? formatDate(changed.created_at, locale)
      : t("common.unknown");
  }, [activity, locale, t]);

  const handleToggle = (key: string) => {
    // Two-factor auth opens a dialog rather than toggling in place: enrolling
    // needs a QR scan and a verified code, and turning it off needs the
    // password. A one-click switch could not ask for either.
    if (key === "totp") {
      if (twoFactor?.enabled) setTotpDisableOpen(true);
      else setTotpSetupOpen(true);
      return;
    }
    // Passkeys open the same dialog whether or not any are registered: it is
    // a device list, and "turn off" would mean revoking every one of them at
    // once, which is never what a single click should do.
    if (key === "passkey") {
      setPasskeyDialogOpen(true);
      return;
    }
    if (key !== "loginAlerts") return;
    updatePreferences(
      { signin_alerts_enabled: !(preferences?.signin_alerts_enabled ?? false) },
      {
        onError: (error) =>
          toast({
            variant: "destructive",
            title: t("dashboard.security.protections.saveFailedTitle"),
            description: apiErrorMessage(error, locale, t("common.tryAgain")),
          }),
      },
    );
  };

  const handleRevoke = (sessionId: string) =>
    revokeSession(sessionId, {
      onSuccess: () =>
        toast({
          title: t("dashboard.security.sessions.revokedTitle"),
          description: t("dashboard.security.sessions.revokedDescription"),
        }),
      onError: (error) =>
        toast({
          variant: "destructive",
          title: t("dashboard.security.sessions.revokeFailedTitle"),
          description: apiErrorMessage(error, locale, t("common.tryAgain")),
        }),
    });

  const handleRevokeAll = () =>
    revokeOthers(undefined, {
      onSuccess: (result) =>
        toast({
          title: t("dashboard.security.sessions.revokedAllTitle"),
          description: t("dashboard.security.sessions.revokedAllDescription", {
            count: result.revoked,
          }),
        }),
      onError: (error) =>
        toast({
          variant: "destructive",
          title: t("dashboard.security.sessions.revokeFailedTitle"),
          description: apiErrorMessage(error, locale, t("common.tryAgain")),
        }),
    });

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t(titleKey)}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t(subtitleKey)}</p>
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

      {isAuthLoading ||
      isSessionsLoading ||
      isActivityLoading ||
      isPrefsLoading ||
      isTwoFactorLoading ? (
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

          <ProtectionList
            items={protections}
            onToggle={handleToggle}
            onChangePassword={() => setPasswordDialogOpen(true)}
            pendingKey={isSavingPreference ? "loginAlerts" : null}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SessionList
              sessions={sessions}
              onRevoke={handleRevoke}
              onRevokeAll={handleRevokeAll}
              revokingId={isRevoking ? revokingId : null}
              isRevokingAll={isRevokingAll}
            />
            <ActivityFeed events={activity} />
          </div>
        </div>
      )}

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <PasskeyDialog
        open={passkeyDialogOpen}
        onOpenChange={setPasskeyDialogOpen}
      />

      <TwoFactorSetupDialog
        open={totpSetupOpen}
        onOpenChange={setTotpSetupOpen}
      />

      <TwoFactorDisableDialog
        open={totpDisableOpen}
        onOpenChange={setTotpDisableOpen}
      />
    </div>
  );
}
