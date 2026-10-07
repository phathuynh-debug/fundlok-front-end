"use client";

import { useState } from "react";
import { Eye, Loader2, Send } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useEmailPolicy,
  useEmailSettings,
  usePreviewEmail,
  useSendEmail,
} from "@/hooks/use-admin-email";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  MAX_RECIPIENTS,
  type EmailContentPayload,
  type EmailPreview,
  type EmailTemplate,
} from "@/services/admin-email.service";
import { EmailPreviewDialog } from "./EmailPreviewDialog";
import { RecipientsField } from "./RecipientsField";
import {
  EMAIL_PATTERN,
  LINE_BREAK,
  asciiDomain,
  emailErrorText,
  isUnknownOutcome,
} from "./email-errors";

// Step 2 of Admin > Email: recipients, a template, plain-text content. The
// server escapes everything and renders the React Email template; Preview
// shows that render before anything is sent.
//
// The <form> submit is a no-op: Enter in a field must not send an email. Only
// the confirm dialog's button does.

const TEMPLATES: EmailTemplate[] = [
  "general",
  "announcement",
  "action_required",
];

interface FieldErrors {
  to?: string;
  subject?: string;
  heading?: string;
  body?: string;
  button?: string;
}

export function ComposeEmailCard() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { data: settings } = useEmailSettings();
  const { data: policy } = useEmailPolicy();
  const allowedDomains = policy?.allowed_domains ?? [];
  const { mutateAsync: renderPreview, isPending: previewing } =
    usePreviewEmail();
  const { mutateAsync: send, isPending: sending } = useSendEmail();

  const [recipients, setRecipients] = useState<string[]>([]);
  const [template, setTemplate] = useState<EmailTemplate>("general");
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ready = !!settings?.configured && settings.enabled;

  // Content checks shared by Preview and Send; Send also checks recipients.
  const contentErrors = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!subject.trim()) {
      next.subject = t("admin.email.compose.subjectRequired");
    } else if (LINE_BREAK.test(subject.trim())) {
      next.subject = t("admin.email.errors.singleLine");
    }
    if (LINE_BREAK.test(heading.trim())) {
      next.heading = t("admin.email.errors.singleLine");
    }
    if (!body.trim()) next.body = t("admin.email.compose.bodyRequired");
    const label = buttonLabel.trim();
    const url = buttonUrl.trim();
    if (LINE_BREAK.test(label)) {
      next.button = t("admin.email.errors.singleLine");
    } else if (!!label !== !!url) {
      next.button = t("admin.email.compose.buttonPair");
    } else if (url && !/^https:\/\/[^\s/]+\S*$/i.test(url)) {
      next.button = t("admin.email.compose.buttonUrlInvalid");
    }
    return next;
  };

  const recipientError = (): string | undefined => {
    if (recipients.length === 0) return t("admin.email.compose.toRequired");
    if (recipients.length > MAX_RECIPIENTS) {
      return t("admin.email.compose.toTooMany").replace(
        "{max}",
        String(MAX_RECIPIENTS),
      );
    }
    const invalid = recipients.filter(
      (address) => !EMAIL_PATTERN.test(address),
    );
    if (invalid.length > 0) {
      return t("admin.email.compose.toInvalid").replace(
        "{list}",
        invalid.join(", "),
      );
    }
    // The server enforces this too; checking here names the addresses. The
    // allowlist is punycode, so compare the recipient's domain in that form.
    if (allowedDomains.length > 0) {
      const outside = recipients.filter((address) => {
        const domain = asciiDomain(address.split("@").pop() ?? "");
        return domain === null || !allowedDomains.includes(domain);
      });
      if (outside.length > 0) {
        return t("admin.email.compose.toOutsideDomains").replace(
          "{list}",
          outside.join(", "),
        );
      }
    }
    return undefined;
  };

  const content = (): EmailContentPayload => ({
    template,
    subject: subject.trim(),
    heading: heading.trim() || null,
    body,
    button_label: buttonLabel.trim() || null,
    button_url: buttonUrl.trim() || null,
  });

  const fail = (err: unknown) =>
    toast({
      variant: "destructive",
      title: t("admin.email.errors.title"),
      description: emailErrorText(err, t, locale),
    });

  const handlePreview = async () => {
    const next = contentErrors();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      setPreview(await renderPreview(content()));
      setPreviewOpen(true);
    } catch (err) {
      fail(err);
    }
  };

  const handleReview = () => {
    const next = contentErrors();
    const toError = recipientError();
    if (toError) next.to = toError;
    setErrors(next);
    if (Object.keys(next).length === 0) setConfirmOpen(true);
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    try {
      const sent = await send({ ...content(), to: recipients });
      const undelivered = sent.undelivered ?? [];
      if (undelivered.length > 0) {
        // Some copies did not go: keep the email as written and leave just
        // those people in the To list, so a second Send reaches them.
        toast({
          variant: "destructive",
          title: t("admin.email.compose.sentPartial"),
          description: t("admin.email.compose.sentPartialHint")
            .replace(
              "{sent}",
              String(sent.recipients.length - undelivered.length),
            )
            .replace("{missed}", String(undelivered.length)),
        });
        setRecipients(undelivered);
        setErrors({});
        return;
      }
      toast({
        title: t("admin.email.compose.sent"),
        description: t("admin.email.compose.sentDescription").replace(
          "{count}",
          String(sent.recipients.length),
        ),
      });
      setRecipients([]);
      setSubject("");
      setHeading("");
      setBody("");
      setButtonLabel("");
      setButtonUrl("");
      setErrors({});
    } catch (err) {
      // No answer (or a gateway giving up) is not a failure: the email may
      // have gone. Keep the form and point at the log rather than inviting a
      // duplicate send.
      if (isUnknownOutcome(err)) {
        toast({
          variant: "destructive",
          title: t("admin.email.errors.title"),
          description: t("admin.email.errors.unknownOutcome"),
        });
        return;
      }
      fail(err);
    }
  };

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {t("admin.email.compose.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.email.compose.description")}
        </p>
      </div>

      {settings && !ready && (
        <p
          role="status"
          className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground"
        >
          {t("admin.email.compose.notReady")}
        </p>
      )}

      <form
        onSubmit={(event) => event.preventDefault()}
        noValidate
        className="mt-6 flex flex-col gap-5"
      >
        <div className="space-y-1">
          <RecipientsField
            recipients={recipients}
            onChange={setRecipients}
            error={errors.to}
          />
          {allowedDomains.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("admin.email.compose.allowedDomains").replace(
                "{list}",
                allowedDomains.join(", "),
              )}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">
            {t("admin.email.compose.templateLabel")}
          </span>
          <div
            role="radiogroup"
            aria-label={t("admin.email.compose.templateLabel")}
            className="grid gap-3 sm:grid-cols-3"
          >
            {TEMPLATES.map((key) => {
              const selected = template === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTemplate(key)}
                  className={cn(
                    "flex flex-col gap-1 rounded-md border p-3 text-left transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {t(`admin.email.compose.templates.${key}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(`admin.email.compose.templates.${key}Hint`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="compose-subject">
              {t("admin.email.compose.subjectLabel")}
            </Label>
            <Input
              id="compose-subject"
              maxLength={200}
              value={subject}
              aria-invalid={!!errors.subject}
              onChange={(event) => setSubject(event.target.value)}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="compose-heading">
              {t("admin.email.compose.headingLabel")}
            </Label>
            <Input
              id="compose-heading"
              maxLength={200}
              value={heading}
              aria-invalid={!!errors.heading}
              onChange={(event) => setHeading(event.target.value)}
            />
            {errors.heading && (
              <p className="text-xs text-destructive">{errors.heading}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="compose-body">
            {t("admin.email.compose.bodyLabel")}
          </Label>
          <Textarea
            id="compose-body"
            rows={8}
            maxLength={10000}
            placeholder={t("admin.email.compose.bodyPlaceholder")}
            value={body}
            aria-invalid={!!errors.body}
            onChange={(event) => setBody(event.target.value)}
          />
          {errors.body && (
            <p className="text-xs text-destructive">{errors.body}</p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="compose-button-label">
              {t("admin.email.compose.buttonLabelLabel")}
            </Label>
            <Input
              id="compose-button-label"
              maxLength={60}
              value={buttonLabel}
              aria-invalid={!!errors.button}
              onChange={(event) => setButtonLabel(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compose-button-url">
              {t("admin.email.compose.buttonUrlLabel")}
            </Label>
            <Input
              id="compose-button-url"
              type="url"
              maxLength={2000}
              placeholder={t("admin.email.compose.buttonUrlPlaceholder")}
              value={buttonUrl}
              aria-invalid={!!errors.button}
              onChange={(event) => setButtonUrl(event.target.value)}
            />
          </div>
          {errors.button && (
            <p className="text-xs text-destructive md:col-span-2">
              {errors.button}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={previewing || sending}
            onClick={handlePreview}
          >
            {previewing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
            {t("admin.email.compose.preview")}
          </Button>
          <Button
            type="button"
            disabled={!ready || sending}
            onClick={handleReview}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {sending
              ? t("admin.email.compose.sending")
              : t("admin.email.compose.send")}
          </Button>
        </div>
      </form>

      <EmailPreviewDialog
        open={previewOpen}
        preview={preview}
        onOpenChange={setPreviewOpen}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.email.compose.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.email.compose.confirmBody")
                .replace("{count}", String(recipients.length))
                .replace("{from}", settings?.gmail_address ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              {t("admin.email.compose.confirmSend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
