"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReminderSender,
  useSaveReminderSender,
} from "@/hooks/use-admin-email";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  ReminderSender,
  ReminderSenderAccount,
  ReminderSenderStatus,
} from "@/services/admin-email.service";
import { emailErrorText } from "../../email/_components/email-errors";

// Which admin's connected Gmail account (Admin > Email) sends the automatic
// repayment reminders to users. Reusing an account an admin already connected
// costs nothing, where a separate email service would not.
//
// The account stays its owner's: pausing sending or disconnecting stops the
// reminders too, so the card shows the chosen account's live status, not just
// its address. Spec: backend docs/specs/admin/internal-email.md (v2.1).

// Radix Select refuses "" as an item value.
const NONE = "none";

// Accounts the backend lets a system admin choose (REMINDER_SENDER_UNAVAILABLE
// otherwise). A paused one can be: its owner may switch sending on later.
const CHOOSABLE: ReminderSenderStatus[] = ["READY", "PAUSED"];

export function ReminderSenderCard() {
  const { t } = useTranslations();
  const { data, isLoading, isError } = useReminderSender();

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {t("admin.system.reminderSender.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.system.reminderSender.description")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {t("admin.system.reminderSender.loadFailed")}
        </p>
      ) : (
        // Keyed on the saved choice so a save re-seeds the picker.
        <SenderForm key={data.sender?.user_id ?? NONE} data={data} />
      )}
    </section>
  );
}

function SenderForm({ data }: { data: ReminderSender }) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { mutateAsync: save, isPending } = useSaveReminderSender();
  const saved = data.sender?.user_id ?? NONE;
  const [selected, setSelected] = useState(saved);

  const handleSave = async () => {
    const userId = selected === NONE ? null : selected;
    try {
      await save(userId);
      toast({
        title: userId
          ? t("admin.system.reminderSender.saved")
          : t("admin.system.reminderSender.savedNone"),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.system.reminderSender.error"),
        description: emailErrorText(err, t, locale),
      });
    }
  };

  const noAccounts = data.candidates.length === 0;

  return (
    <div className="mt-6 flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-px h-4 w-4 shrink-0" aria-hidden />
        {t("admin.system.reminderSender.notLiveYet")}
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reminder-sender">
          {t("admin.system.reminderSender.accountLabel")}
        </Label>
        <Select
          value={selected}
          onValueChange={setSelected}
          disabled={isPending}
        >
          <SelectTrigger id="reminder-sender" className="w-full sm:max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>
              {t("admin.system.reminderSender.none")}
            </SelectItem>
            {data.candidates.map((account) => (
              <SelectItem
                key={account.user_id}
                value={account.user_id}
                disabled={!CHOOSABLE.includes(account.status)}
              >
                {accountLabel(account, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {noAccounts && (
          <p className="text-xs text-muted-foreground">
            {t("admin.system.reminderSender.noAccounts")}{" "}
            <Link
              href="/admin/email"
              className="font-medium text-foreground underline underline-offset-2"
            >
              {t("admin.system.reminderSender.openEmail")}
            </Link>
          </p>
        )}
      </div>

      {/* The saved choice's live state: what actually happens today. */}
      <SenderStatus sender={data.sender} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={isPending || selected === saved}
          onClick={() => void handleSave()}
        >
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {isPending
            ? t("admin.system.reminderSender.saving")
            : t("admin.system.reminderSender.save")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {data.updated_at
            ? t("admin.system.reminderSender.lastChanged").replace(
                "{date}",
                formatDateTime(data.updated_at, locale),
              )
            : t("admin.system.reminderSender.neverChanged")}
        </p>
      </div>
    </div>
  );
}

function accountLabel(
  account: ReminderSenderAccount,
  t: (key: string) => string,
): string {
  const who = account.full_name?.trim() || account.from_name?.trim();
  const address = account.gmail_address ?? "—";
  const base = who ? `${who} · ${address}` : address;
  if (account.status === "READY") return base;
  const note =
    account.status === "PAUSED"
      ? t("admin.system.reminderSender.optionPaused")
      : t("admin.system.reminderSender.optionUnavailable");
  return `${base} (${note})`;
}

function SenderStatus({ sender }: { sender: ReminderSenderAccount | null }) {
  const { t } = useTranslations();

  if (!sender) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("admin.system.reminderSender.noneChosen")}
      </p>
    );
  }

  const ready = sender.status === "READY";
  const text = t(`admin.system.reminderSender.status.${sender.status}`).replace(
    "{email}",
    sender.gmail_address ?? "—",
  );

  return (
    <p
      role={ready ? undefined : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-xs leading-relaxed text-foreground",
        ready
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-amber-500/40 bg-amber-500/10",
      )}
    >
      {ready ? (
        <CheckCircle2
          className="mt-px h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500"
          aria-hidden
        />
      ) : (
        <AlertTriangle
          className="mt-px h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
      )}
      <span>
        {text}
        {!ready && sender.status !== "NOT_ADMIN" && (
          <>
            {" "}
            <Link
              href="/admin/email"
              className="font-medium text-foreground underline underline-offset-2"
            >
              {t("admin.system.reminderSender.openEmail")}
            </Link>
          </>
        )}
      </span>
    </p>
  );
}
