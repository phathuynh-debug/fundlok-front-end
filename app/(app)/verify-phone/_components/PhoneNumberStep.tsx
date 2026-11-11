"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import { isVietnameseMobile } from "@/lib/phone-verification";

interface PhoneNumberStepProps {
  /** The number on file (typed at registration), if any. */
  initialPhone: string;
  onSend: (phone: string) => void;
  isSending: boolean;
  /** i18n key of the last send's refusal. */
  sendError: string | null;
  /** False until the Turnstile check has produced a token. */
  canSend: boolean;
}

export function PhoneNumberStep({
  initialPhone,
  onSend,
  isSending,
  sendError,
  canSend,
}: PhoneNumberStepProps) {
  const { t } = useTranslations();
  // Null until the user types, so a number on file prefills the field even
  // when the user loads after this mounts.
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const phone = draft ?? initialPhone;
  const errorKey = invalid ? "auth.verifyPhone.errors.phoneInvalid" : sendError;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isVietnameseMobile(phone)) {
      setInvalid(true);
      return;
    }
    onSend(phone.trim());
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-muted-foreground text-sm lg:text-base text-center leading-relaxed max-w-sm mx-auto">
        {t("auth.verifyPhone.description")}
      </p>

      <div className="space-y-2">
        <Label htmlFor="verify-phone-number">
          {t("auth.verifyPhone.phoneLabel")}
        </Label>
        <Input
          id="verify-phone-number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("auth.verifyPhone.phonePlaceholder")}
          value={phone}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(false);
          }}
          aria-invalid={!!errorKey}
          aria-describedby="verify-phone-hint verify-phone-error"
          className="h-11"
        />
        <p id="verify-phone-hint" className="text-xs text-muted-foreground">
          {t("auth.verifyPhone.phoneHint")}
        </p>
      </div>

      {errorKey && (
        <p
          id="verify-phone-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {t(errorKey)}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSending || !phone.trim() || !canSend}
        className="w-full h-11"
      >
        {isSending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("common.processing")}
          </>
        ) : (
          t("auth.verifyPhone.sendBtn")
        )}
      </Button>
    </form>
  );
}
