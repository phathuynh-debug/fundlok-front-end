"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Loader2, Lock, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadFundlokRecipients } from "@/hooks/use-admin-email";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MAX_RECIPIENTS } from "@/services/admin-email.service";
import { EMAIL_PATTERN, parseList } from "./email-errors";
import { RecipientPickerDialog } from "./RecipientPickerDialog";

// The To list: one chip per address. Addresses can be typed or pasted
// (Enter, comma or space ends one), picked from the system's users, or added
// all at once with "Add all FundLok emails". The list itself is the
// composer's state; this component only edits it.

/** Merge `extra` into `current`, case-insensitively, keeping the first
 * spelling and order. Returns the merged list and how many were dropped for
 * the per-email cap. */
function merge(current: string[], extra: string[]) {
  const seen = new Set(current.map((email) => email.toLowerCase()));
  const merged = [...current];
  for (const email of extra) {
    if (!seen.has(email.toLowerCase())) {
      seen.add(email.toLowerCase());
      merged.push(email);
    }
  }
  return {
    list: merged.slice(0, MAX_RECIPIENTS),
    dropped: Math.max(merged.length - MAX_RECIPIENTS, 0),
  };
}

export function RecipientsField({
  recipients,
  onChange,
  error,
}: {
  recipients: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const loadFundlok = useLoadFundlokRecipients();
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingFundlok, setLoadingFundlok] = useState(false);
  // The list as it is now, for merging after an await: the props captured
  // when the request started may be stale by the time it returns.
  const latest = useRef(recipients);
  useEffect(() => {
    latest.current = recipients;
  }, [recipients]);

  const warnDropped = (dropped: number) => {
    if (dropped > 0) {
      toast({
        variant: "destructive",
        title: t("admin.email.recipients.truncated").replace(
          "{max}",
          String(MAX_RECIPIENTS),
        ),
      });
    }
  };

  const commitDraft = (value = draft) => {
    const typed = parseList(value);
    if (typed.length === 0) return;
    const { list, dropped } = merge(recipients, typed);
    onChange(list);
    setDraft("");
    warnDropped(dropped);
  };

  const remove = (email: string) =>
    onChange(recipients.filter((item) => item !== email));

  const addAllFundlok = async () => {
    setLoadingFundlok(true);
    try {
      const users = await loadFundlok();
      if (users.length === 0) {
        toast({ title: t("admin.email.recipients.fundlokNone") });
        return;
      }
      const current = latest.current;
      const before = current.length;
      const { list, dropped } = merge(
        current,
        users.map((user) => user.email),
      );
      onChange(list);
      toast({
        title: t("admin.email.recipients.fundlokAdded").replace(
          "{count}",
          String(list.length - before),
        ),
      });
      warnDropped(dropped);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.email.picker.loadFailed"),
        description: apiErrorMessage(err, locale, t("common.tryAgain")),
      });
    } finally {
      setLoadingFundlok(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="compose-to-input">
          {t("admin.email.compose.toLabel")}
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingFundlok}
            onClick={() => setPickerOpen(true)}
          >
            <Users className="h-4 w-4" aria-hidden />
            {t("admin.email.recipients.pickUsers")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingFundlok}
            onClick={addAllFundlok}
          >
            {loadingFundlok ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Building2 className="h-4 w-4" aria-hidden />
            )}
            {t("admin.email.recipients.addFundlok")}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5",
          error ? "border-destructive" : "border-input",
        )}
      >
        {recipients.map((email) => {
          const malformed = !EMAIL_PATTERN.test(email);
          return (
            <span
              key={email}
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
                malformed
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border bg-muted/50 text-foreground",
              )}
            >
              <span className="truncate">{email}</span>
              <button
                type="button"
                onClick={() => remove(email)}
                aria-label={t("admin.email.recipients.remove").replace(
                  "{email}",
                  email,
                )}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          );
        })}
        <Input
          id="compose-to-input"
          autoComplete="off"
          spellCheck={false}
          className="h-8 min-w-[12rem] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          placeholder={
            recipients.length === 0
              ? t("admin.email.recipients.inputPlaceholder")
              : undefined
          }
          value={draft}
          aria-invalid={!!error}
          aria-describedby="compose-to-help"
          onChange={(event) => {
            const value = event.target.value;
            // A separator ends the address being typed; a paste of several
            // addresses lands here whole and is split the same way.
            if (/[\s,;]/.test(value)) commitDraft(value);
            else setDraft(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            } else if (
              event.key === "Backspace" &&
              draft === "" &&
              recipients.length > 0
            ) {
              remove(recipients[recipients.length - 1]);
            }
          }}
          onBlur={() => commitDraft()}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p
        id="compose-to-help"
        className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground"
      >
        <Lock className="h-3 w-3" aria-hidden />
        <span>{t("admin.email.recipients.privateCopies")}</span>
        <span>
          {t("admin.email.recipients.count")
            .replace("{count}", String(recipients.length))
            .replace("{max}", String(MAX_RECIPIENTS))}
        </span>
      </p>

      <RecipientPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selected={recipients}
        onConfirm={(emails) => {
          // The picker returns the whole ticked set (it started from this
          // list), so it replaces the list rather than adding to it.
          const { list, dropped } = merge([], emails);
          onChange(list);
          warnDropped(dropped);
        }}
      />
    </div>
  );
}
