"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useTurnstile } from "@/hooks/use-turnstile";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export function ContactForm() {
  const { t, locale } = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Cloudflare Turnstile Hook
  const { turnstileToken, turnstileContainerRef, reset: resetTurnstile } = useTurnstile();

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: t("contactPage.form.securityCheckRequired"),
        description: t("contactPage.form.completeSecurityCheck"),
      });
      return;
    }

    setIsPending(true);

    try {
      await apiClient.post("/contact", {
        name,
        email,
        subject,
        message,
        turnstile_token: turnstileToken,
      });

      toast({
        title: t("contactPage.form.messageSent"),
        description: t("contactPage.form.inquirySubmitted"),
      });

      // Reset form states
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      // Reset Turnstile widget visually
      resetTurnstile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("contactPage.form.failedToSendMessage"),
        description:
          error?.message ||
          (locale === "vi"
            ? "Đã có lỗi xảy ra. Vui lòng thử lại."
            : "Something went wrong. Please try again."),
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder={t("contactPage.form.namePlaceholder")}
          className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
        />
        <input
          type="email"
          placeholder={t("contactPage.form.emailPlaceholder")}
          className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <input
        type="text"
        placeholder={t("contactPage.form.subjectPlaceholder")}
        className="w-full rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        disabled={isPending}
      />
      <textarea
        placeholder={t("contactPage.form.messagePlaceholder")}
        className="h-36 w-full resize-none rounded-2xl border border-border/40 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-500"
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
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        {isPending ? t("contactPage.form.sending") : t("contactPage.form.sendMessage")}
      </button>
    </form>
  );
}
