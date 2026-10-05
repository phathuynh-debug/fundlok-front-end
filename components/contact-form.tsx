"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTurnstile } from "@/hooks/use-turnstile";
import { useSubmitContact } from "@/hooks/use-contact";
import { CONTACT_PURPOSE_OPTIONS } from "@/lib/constants/contact-purposes";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { apiErrorMessage } from "@/lib/api-error-message";

// Matches the plain inputs below: the shadcn trigger ships a compact h-9
// rounded-md control, so the size/radius/padding are overridden rather than
// letting the select sit a few pixels shorter than its neighbours.
const SELECT_TRIGGER_CLASS =
  "w-full rounded-2xl border-border/40 bg-transparent px-4 py-3 text-sm shadow-none " +
  "data-[size=default]:h-auto data-[placeholder]:text-muted-foreground " +
  "dark:bg-transparent dark:hover:bg-transparent " +
  "focus-visible:border-emerald-500 focus-visible:ring-0";

export function ContactForm() {
  const { t, locale } = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Cloudflare Turnstile Hook
  const {
    turnstileToken,
    turnstileContainerRef,
    reset: resetTurnstile,
  } = useTurnstile();

  const { toast } = useToast();
  const submitContact = useSubmitContact();
  const isPending = submitContact.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // The trigger is a button, not a <select>, so `required` can't enforce this.
    if (!purpose) {
      toast({
        variant: "destructive",
        title: t("contactPage.form.purposeRequired"),
        description: t("contactPage.form.selectPurpose"),
      });
      return;
    }

    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: t("contactPage.form.securityCheckRequired"),
        description: t("contactPage.form.completeSecurityCheck"),
      });
      return;
    }

    submitContact.mutate(
      {
        name,
        email,
        purpose,
        subject,
        message,
        turnstile_token: turnstileToken,
      },
      {
        onSuccess: () => {
          toast({
            title: t("contactPage.form.messageSent"),
            description: t("contactPage.form.inquirySubmitted"),
          });

          // Reset form states
          setName("");
          setEmail("");
          setPurpose("");
          setSubject("");
          setMessage("");
          // Reset Turnstile widget visually
          resetTurnstile();
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: t("contactPage.form.failedToSendMessage"),
            description: apiErrorMessage(
              error,
              locale,
              locale === "vi"
                ? "Đã có lỗi xảy ra. Vui lòng thử lại."
                : "Something went wrong. Please try again.",
            ),
          });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder={t("contactPage.form.namePlaceholder")}
          className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-emerald-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
        />
        <input
          type="email"
          placeholder={t("contactPage.form.emailPlaceholder")}
          className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-emerald-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <Select value={purpose} onValueChange={setPurpose} disabled={isPending}>
        <SelectTrigger
          className={SELECT_TRIGGER_CLASS}
          aria-label={t("contactPage.form.purposePlaceholder")}
        >
          <SelectValue placeholder={t("contactPage.form.purposePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {CONTACT_PURPOSE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(`contactPage.form.purposes.${option.labelKey}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        type="text"
        placeholder={t("contactPage.form.subjectPlaceholder")}
        className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-emerald-500"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        disabled={isPending}
      />
      <textarea
        placeholder={t("contactPage.form.messagePlaceholder")}
        className="h-36 w-full resize-none rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-emerald-500"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        disabled={isPending}
      />

      {/* Cloudflare Turnstile Spam Prevention */}
      {process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" && (
        <div className="flex justify-center py-2">
          <div ref={turnstileContainerRef} />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !turnstileToken}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        {isPending
          ? t("contactPage.form.sending")
          : t("contactPage.form.sendMessage")}
      </button>
    </form>
  );
}
