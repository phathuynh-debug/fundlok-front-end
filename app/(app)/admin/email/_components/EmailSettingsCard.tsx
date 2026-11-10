"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Unplug,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  adminEmailKeys,
  useDisconnectGmail,
  useEmailSettings,
  useSaveEmailSettings,
  useSendTestEmail,
  useStartGoogleConnect,
} from "@/hooks/use-admin-email";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { EmailSettings } from "@/services/admin-email.service";
import {
  LINE_BREAK,
  emailErrorText,
  isUnknownOutcome,
  oauthErrorText,
} from "./email-errors";

// Step 1 of Admin > Email: the signed-in admin's own Google account, which
// their email goes out from. Each admin connects their own with Google OAuth
// ("Connect with Google"); the backend keeps only an encrypted refresh token
// and sends through the Gmail API. The address comes from Google, so it is
// shown, never typed. Sender name, signature and the sending switch are
// edited here and saved separately from the connection.

export function EmailSettingsCard() {
  const { t } = useTranslations();
  // isPending, not isLoading: it also covers the moment before the query
  // is enabled (waiting for the admin's id), which would otherwise read as
  // an error.
  const { data, isPending, isError } = useEmailSettings();
  const { data: user } = useCurrentUser();

  return (
    <section className="rounded-lg border bg-card p-6">
      {/* useSearchParams needs a Suspense boundary in the App Router. */}
      <Suspense fallback={null}>
        <GoogleConnectResult />
      </Suspense>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {t("admin.email.settings.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.email.settings.description")}
        </p>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {t("admin.email.settings.loadFailed")}
        </p>
      ) : (
        // Keyed on the saved values the form shows, so a save or a disconnect
        // re-seeds it from the server's answer instead of syncing state in an
        // effect. Not on updated_at: a test email bumps that, and must not
        // wipe edits that have not been saved yet.
        <SettingsForm
          key={JSON.stringify([
            data.from_name,
            data.enabled,
            data.signature_name,
            data.signature_title,
            data.signature_phone,
          ])}
          settings={data}
          // No row yet: start from the admin's own name, since the email is
          // meant to come from them.
          defaultName={user?.full_name ?? ""}
          accountEmail={user?.email ?? null}
        />
      )}
    </section>
  );
}

// Google sends the browser back to /api/admin/email/oauth/callback, which
// redirects here with ?connected=true or ?error=<code>. Say how it went
// once, then drop the parameters so a reload does not say it again.
function GoogleConnectResult() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const connected = params.get("connected") === "true";
  const error = params.get("error");
  // React's development double-run of effects must not toast twice.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!connected && !error) return;
    const outcome = connected ? "connected" : `error:${error}`;
    if (handled.current === outcome) return;
    handled.current = outcome;

    if (connected) {
      toast({
        title: t("admin.email.oauth.connected"),
        description: t("admin.email.oauth.connectedBody"),
      });
      // The page may have been restored from the back/forward cache with the
      // old answer; read the connection again.
      void queryClient.invalidateQueries({ queryKey: adminEmailKeys.all });
    } else if (error) {
      toast({
        variant: "destructive",
        title: t("admin.email.oauth.errorTitle"),
        description: oauthErrorText(error, t),
      });
    }
    router.replace("/admin/email", { scroll: false });
  }, [connected, error, toast, t, router, queryClient]);

  return null;
}

interface FieldErrors {
  fromName?: string;
  signatureName?: string;
  signatureTitle?: string;
  signaturePhone?: string;
}

function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

function SettingsForm({
  settings,
  defaultName,
  accountEmail,
}: {
  settings: EmailSettings;
  defaultName: string;
  accountEmail: string | null;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { mutateAsync: save, isPending: saving } = useSaveEmailSettings();
  const { mutateAsync: disconnect, isPending: disconnecting } =
    useDisconnectGmail();
  const { mutateAsync: sendTest, isPending: testing } = useSendTestEmail();
  const { mutateAsync: startConnect, isPending: starting } =
    useStartGoogleConnect();
  // Stays true once the browser is on its way to Google, so the button does
  // not come back to life in the moment before the page unloads.
  const [redirecting, setRedirecting] = useState(false);

  const [fromName, setFromName] = useState(settings.from_name ?? defaultName);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [signatureName, setSignatureName] = useState(
    settings.signature_name ?? "",
  );
  const [signatureTitle, setSignatureTitle] = useState(
    settings.signature_title ?? "",
  );
  const [signaturePhone, setSignaturePhone] = useState(
    settings.signature_phone ?? "",
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const emailMismatch = Boolean(
    settings.gmail_address &&
    accountEmail &&
    settings.gmail_address.trim().toLowerCase() !==
      accountEmail.trim().toLowerCase(),
  );

  const connecting = starting || redirecting;
  const busy = saving || disconnecting || testing || connecting;
  // The server refuses to turn sending ON without an account or when the
  // connected email does not match the signed-in admin's account email.
  const canTurnOn = (settings.configured || settings.enabled) && !emailMismatch;

  const handleConnect = async () => {
    try {
      const { authorization_url } = await startConnect();
      setRedirecting(true);
      window.location.assign(authorization_url);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.email.settings.connectFailedTitle"),
        description: emailErrorText(err, t, locale),
      });
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!fromName.trim()) {
      next.fromName = t("admin.email.settings.fromNameRequired");
    } else if (LINE_BREAK.test(fromName.trim())) {
      next.fromName = t("admin.email.errors.singleLine");
    }
    if (LINE_BREAK.test(signatureName.trim())) {
      next.signatureName = t("admin.email.errors.singleLine");
    }
    if (LINE_BREAK.test(signatureTitle.trim())) {
      next.signatureTitle = t("admin.email.errors.singleLine");
    }
    if (LINE_BREAK.test(signaturePhone.trim())) {
      next.signaturePhone = t("admin.email.errors.singleLine");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await save({
        from_name: fromName.trim(),
        enabled,
        signature_name: signatureName.trim() || null,
        signature_title: signatureTitle.trim() || null,
        signature_phone: signaturePhone.trim() || null,
      });
      toast({ title: t("admin.email.settings.saved") });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.email.errors.saveTitle"),
        description: emailErrorText(err, t, locale),
      });
    }
  };

  const handleTest = async () => {
    try {
      const result = await sendTest();
      toast({
        title: t("admin.email.settings.testSent").replace(
          "{email}",
          result.sent_to,
        ),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.email.errors.title"),
        description: isUnknownOutcome(err)
          ? t("admin.email.errors.unknownOutcome")
          : emailErrorText(err, t, locale),
      });
    }
  };

  const handleDisconnect = async () => {
    setConfirmDisconnect(false);
    try {
      await disconnect();
      toast({ title: t("admin.email.settings.disconnected") });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.email.errors.saveTitle"),
        description: emailErrorText(err, t, locale),
      });
    }
  };

  return (
    <form onSubmit={handleSave} noValidate className="mt-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge settings={settings} emailMismatch={emailMismatch} />
        <span className="text-xs text-muted-foreground">
          {settings.last_verified_at
            ? t("admin.email.settings.lastVerified").replace(
                "{date}",
                formatDateTime(settings.last_verified_at, locale),
              )
            : t("admin.email.settings.neverVerified")}
        </span>
      </div>

      <GoogleAccountBox
        settings={settings}
        accountEmail={accountEmail}
        emailMismatch={emailMismatch}
        busy={busy}
        connecting={connecting}
        onConnect={handleConnect}
        onDisconnect={() => setConfirmDisconnect(true)}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email-from-name">
            {t("admin.email.settings.fromNameLabel")}
          </Label>
          <Input
            id="email-from-name"
            autoComplete="off"
            maxLength={80}
            placeholder={t("admin.email.settings.fromNamePlaceholder")}
            value={fromName}
            aria-invalid={!!errors.fromName}
            onChange={(event) => setFromName(event.target.value)}
          />
          {errors.fromName && (
            <p className="text-xs text-destructive">{errors.fromName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("admin.email.settings.signatureHelp")}</Label>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="email-signature-name">
              {t("admin.email.settings.signatureNameLabel")}
            </Label>
            <Input
              id="email-signature-name"
              autoComplete="off"
              maxLength={80}
              placeholder={t("admin.email.settings.signatureNamePlaceholder")}
              value={signatureName}
              aria-invalid={!!errors.signatureName}
              onChange={(event) => setSignatureName(event.target.value)}
            />
            {errors.signatureName && (
              <p className="text-xs text-destructive">{errors.signatureName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signature-title">
              {t("admin.email.settings.signatureTitleLabel")}
            </Label>
            <Input
              id="email-signature-title"
              autoComplete="off"
              maxLength={120}
              placeholder={t("admin.email.settings.signatureTitlePlaceholder")}
              value={signatureTitle}
              aria-invalid={!!errors.signatureTitle}
              onChange={(event) => setSignatureTitle(event.target.value)}
            />
            {errors.signatureTitle && (
              <p className="text-xs text-destructive">
                {errors.signatureTitle}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signature-phone">
              {t("admin.email.settings.signaturePhoneLabel")}
            </Label>
            <Input
              id="email-signature-phone"
              autoComplete="off"
              maxLength={40}
              placeholder={t("admin.email.settings.signaturePhonePlaceholder")}
              value={signaturePhone}
              aria-invalid={!!errors.signaturePhone}
              onChange={(event) => setSignaturePhone(event.target.value)}
            />
            {errors.signaturePhone && (
              <p className="text-xs text-destructive">
                {errors.signaturePhone}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border p-4">
        <div className="space-y-1">
          <Label htmlFor="email-enabled">
            {t("admin.email.settings.enabledLabel")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {canTurnOn
              ? t("admin.email.settings.enabledHelp")
              : t("admin.email.settings.enabledNeedsAccount")}
          </p>
        </div>
        <Switch
          id="email-enabled"
          checked={enabled}
          disabled={!canTurnOn && !enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving
            ? t("admin.email.settings.saving")
            : t("admin.email.settings.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || !settings.configured || emailMismatch}
          onClick={handleTest}
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          {testing
            ? t("admin.email.settings.sendingTest")
            : t("admin.email.settings.sendTest")}
        </Button>
      </div>

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.email.settings.disconnectTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.email.settings.disconnectBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              {t("admin.email.settings.disconnectConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

// The Google account itself: who is connected and the Connect / Reconnect /
// Disconnect actions. Three states: connected, connection lost (Google
// revoked access, or an App Password connection from before OAuth), none.
function GoogleAccountBox({
  settings,
  accountEmail,
  emailMismatch,
  busy,
  connecting,
  onConnect,
  onDisconnect,
}: {
  settings: EmailSettings;
  accountEmail: string | null;
  emailMismatch: boolean;
  busy: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { t, locale } = useTranslations();
  const displayGmailAddress = settings.gmail_address
    ? emailMismatch
      ? maskEmailAddress(settings.gmail_address)
      : settings.gmail_address
    : null;

  const connectButton = (label: string) => (
    <Button type="button" variant="outline" disabled={busy} onClick={onConnect}>
      {connecting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : settings.configured ? (
        <RefreshCw className="h-4 w-4" aria-hidden />
      ) : (
        <GoogleIcon />
      )}
      {connecting ? t("admin.email.settings.connecting") : label}
    </Button>
  );

  return (
    <div className="space-y-2">
      <Label>{t("admin.email.settings.accountLabel")}</Label>
      <div
        className={
          emailMismatch
            ? "flex flex-col gap-4 rounded-md border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        {settings.configured && displayGmailAddress ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background">
              <GoogleIcon />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("admin.email.settings.connectedAs")}
              </p>
              <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                <Mail
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate">{displayGmailAddress}</span>
              </p>
              {settings.connected_at && (
                <p className="text-xs text-muted-foreground">
                  {t("admin.email.settings.connectedSince").replace(
                    "{date}",
                    formatDateTime(settings.connected_at, locale),
                  )}
                </p>
              )}
            </div>
          </div>
        ) : settings.needs_reconnect && displayGmailAddress ? (
          <p
            role="status"
            className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {t("admin.email.settings.needsReconnect").replace(
                "{email}",
                displayGmailAddress,
              )}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("admin.email.settings.notConnectedHelp")}
          </p>
        )}

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {settings.configured ? (
            <>
              {connectButton(t("admin.email.settings.reconnect"))}
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={busy}
                onClick={onDisconnect}
              >
                <Unplug className="h-4 w-4" aria-hidden />
                {t("admin.email.settings.disconnect")}
              </Button>
            </>
          ) : (
            connectButton(
              settings.needs_reconnect
                ? t("admin.email.settings.reconnect")
                : t("admin.email.settings.connect"),
            )
          )}
        </div>
      </div>

      {emailMismatch && displayGmailAddress && accountEmail && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {t("admin.email.settings.emailMismatchWarning")
              .replace("{connectedEmail}", displayGmailAddress)
              .replaceAll("{accountEmail}", accountEmail)}
          </span>
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  settings,
  emailMismatch,
}: {
  settings: EmailSettings;
  emailMismatch: boolean;
}) {
  const { t } = useTranslations();
  if (emailMismatch) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-destructive/40 bg-destructive/10 text-destructive"
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        {t("admin.email.settings.statusEmailMismatch")}
      </Badge>
    );
  }
  if (!settings.configured) {
    if (settings.needs_reconnect) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          {t("admin.email.settings.statusNeedsReconnect")}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        {t("admin.email.settings.statusNotConnected")}
      </Badge>
    );
  }
  if (!settings.enabled) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      >
        {t("admin.email.settings.statusPaused")}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      {t("admin.email.settings.statusOn")}
    </Badge>
  );
}

// Google's "G", as on the sign-in button (components/login-form.tsx).
function GoogleIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 533.5 544.3"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M533.5 278.4c0-18.5-1.5-37.3-4.7-55.3H272v104.8h147.5c-6.3 34.1-25.1 62.9-53.6 82.2v68.2h86.6c50.7-46.7 80-115.4 80-199.9z"
      />
      <path
        fill="#34A853"
        d="M272 544.3c72.6 0 133.6-23.9 178.2-64.8l-86.6-68.2c-24.1 16.2-55 25.8-91.6 25.8-70 0-129.3-47.2-150.5-110.5H32.3v69.5C76.9 489.5 167.6 544.3 272 544.3z"
      />
      <path
        fill="#FBBC05"
        d="M121.5 325c-10.7-32-10.7-66.2 0-98.2V157.3H32.3c-43 85.4-43 187.2 0 272.6l89.2-69.9z"
      />
      <path
        fill="#EA4335"
        d="M272 109.7c38.8 0 73.6 13.4 101 39l75.7-75.7C405.8 28.2 349.6 0 272 0 167.6 0 76.9 54.8 32.3 137.8l89.2 69.5c21.2-63.3 80.5-110.5 150.5-110.5z"
      />
    </svg>
  );
}
