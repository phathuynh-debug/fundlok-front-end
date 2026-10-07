"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
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
  useClearEmailSettings,
  useEmailSettings,
  useSaveEmailSettings,
  useSendTestEmail,
} from "@/hooks/use-admin-email";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { EmailSettings } from "@/services/admin-email.service";
import {
  EMAIL_PATTERN,
  LINE_BREAK,
  emailErrorText,
  isNoResponse,
} from "./email-errors";

// Step 1 of Admin > Email: the signed-in admin's own Gmail account, which
// their email goes out from. Each admin has their own; nobody else sees or
// uses it. The app password is write-only: the server never returns it, so
// the field starts empty and a blank field on save keeps the stored one.

const APP_PASSWORDS_URL = "https://myaccount.google.com/apppasswords";

export function EmailSettingsCard() {
  const { t } = useTranslations();
  // isPending, not isLoading: it also covers the moment before the query
  // is enabled (waiting for the admin's id), which would otherwise read as
  // an error.
  const { data, isPending, isError } = useEmailSettings();
  const { data: user } = useCurrentUser();

  return (
    <section className="rounded-lg border bg-card p-6">
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
            data.gmail_address,
            data.from_name,
            data.enabled,
            data.configured,
          ])}
          settings={data}
          // Not connected yet: start from the admin's own account, since the
          // email is meant to come from them.
          defaultAddress={user?.email ?? ""}
          defaultName={user?.full_name ?? ""}
        />
      )}
    </section>
  );
}

interface FieldErrors {
  address?: string;
  password?: string;
  fromName?: string;
}

function SettingsForm({
  settings,
  defaultAddress,
  defaultName,
}: {
  settings: EmailSettings;
  defaultAddress: string;
  defaultName: string;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { mutateAsync: save, isPending: saving } = useSaveEmailSettings();
  const { mutateAsync: clear, isPending: clearing } = useClearEmailSettings();
  const { mutateAsync: sendTest, isPending: testing } = useSendTestEmail();

  const [address, setAddress] = useState(
    settings.gmail_address ?? defaultAddress,
  );
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState(settings.from_name ?? defaultName);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmClear, setConfirmClear] = useState(false);

  const busy = saving || clearing || testing;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const compactPassword = password.replace(/\s+/g, "");
    const next: FieldErrors = {};
    if (!EMAIL_PATTERN.test(address.trim())) {
      next.address = t("admin.email.settings.addressInvalid");
    }
    if (compactPassword && !/^[A-Za-z0-9]{16}$/.test(compactPassword)) {
      next.password = t("admin.email.settings.passwordInvalid");
    }
    if (!fromName.trim()) {
      next.fromName = t("admin.email.settings.fromNameRequired");
    } else if (LINE_BREAK.test(fromName.trim())) {
      next.fromName = t("admin.email.errors.singleLine");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await save({
        gmail_address: address.trim(),
        from_name: fromName.trim(),
        app_password: compactPassword || null,
        enabled,
      });
      // Saved; the server will never send it back, so do not keep it here.
      setPassword("");
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
        description: isNoResponse(err)
          ? t("admin.email.errors.unknownOutcome")
          : emailErrorText(err, t, locale),
      });
    }
  };

  const handleClear = async () => {
    setConfirmClear(false);
    try {
      await clear();
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
        <StatusBadge settings={settings} />
        <span className="text-xs text-muted-foreground">
          {settings.last_verified_at
            ? t("admin.email.settings.lastVerified").replace(
                "{date}",
                formatDateTime(settings.last_verified_at, locale),
              )
            : t("admin.email.settings.neverVerified")}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email-address">
            {t("admin.email.settings.addressLabel")}
          </Label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="email-address"
              type="email"
              autoComplete="off"
              className="pl-10"
              placeholder={t("admin.email.settings.addressPlaceholder")}
              value={address}
              aria-invalid={!!errors.address}
              aria-describedby={
                errors.address ? "email-address-error" : undefined
              }
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          {errors.address && (
            <p id="email-address-error" className="text-xs text-destructive">
              {errors.address}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-password">
            {t("admin.email.settings.passwordLabel")}
          </Label>
          <div className="relative">
            <KeyRound
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="email-password"
              type="password"
              // Not the admin's own password. "off" (not "new-password",
              // which invites the browser to generate one) and the
              // password-manager opt-outs ask them not to fill or save it;
              // a browser may still offer to save, and the admin should
              // decline.
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              spellCheck={false}
              maxLength={64}
              className="pl-10"
              placeholder={
                settings.has_app_password
                  ? t("admin.email.settings.passwordSavedPlaceholder")
                  : t("admin.email.settings.passwordPlaceholder")
              }
              value={password}
              aria-invalid={!!errors.password}
              aria-describedby="email-password-help"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
          <p id="email-password-help" className="text-xs text-muted-foreground">
            {t("admin.email.settings.passwordHelp")}{" "}
            <a
              href={APP_PASSWORDS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2"
            >
              {t("admin.email.settings.passwordHelpLink")}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </p>
        </div>

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

      <div className="flex items-center justify-between gap-4 rounded-md border p-4">
        <div className="space-y-1">
          <Label htmlFor="email-enabled">
            {t("admin.email.settings.enabledLabel")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("admin.email.settings.enabledHelp")}
          </p>
        </div>
        <Switch
          id="email-enabled"
          checked={enabled}
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
          disabled={busy || !settings.configured}
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
        {settings.gmail_address && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => setConfirmClear(true)}
          >
            <Unplug className="h-4 w-4" aria-hidden />
            {t("admin.email.settings.disconnect")}
          </Button>
        )}
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
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
            <AlertDialogAction onClick={handleClear}>
              {t("admin.email.settings.disconnectConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function StatusBadge({ settings }: { settings: EmailSettings }) {
  const { t } = useTranslations();
  if (!settings.configured) {
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
