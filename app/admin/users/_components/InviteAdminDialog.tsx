"use client";

import { useState } from "react";
import { Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { roleLabel } from "@/lib/enum-labels";
import { useTranslations } from "@/lib/i18n";
import type { ApiError } from "@/lib/types";

// Adds an operator to the admin console. Rendered only for a SYSTEM_ADMIN;
// the server enforces that independently (403 for anyone else).
//
// Two steps on purpose. The new account has no password: whoever controls the
// inbox sets it from the emailed link, so a mistyped address hands admin
// access to a stranger. The review step puts the address in front of the
// operator once more before anything is sent, and only its explicit button
// performs the invite — the <form> submit (Enter key) merely advances to it.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;

type Step = "form" | "review";

interface FieldErrors {
  fullName?: string;
  email?: string;
}

export function InviteAdminDialog() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { mutateAsync: inviteAdmin, isPending } = useInviteAdmin();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();

  const reset = () => {
    setStep("form");
    setFullName("");
    setEmail("");
    setErrors({});
  };

  const handleOpenChange = (next: boolean) => {
    // Don't let the dialog close underneath a request in flight.
    if (!next && isPending) return;
    // Start clean on open rather than on close: resetting while the exit
    // animation runs flashes the empty form for a moment.
    if (next) reset();
    setOpen(next);
  };

  const handleReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!trimmedName) nextErrors.fullName = t("admin.inviteAdmin.nameRequired");
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = t("admin.inviteAdmin.emailInvalid");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep("review");
  };

  const handleSend = async () => {
    try {
      await inviteAdmin({ email: trimmedEmail, full_name: trimmedName });
      toast({
        title: t("admin.inviteAdmin.successTitle"),
        description: t("admin.inviteAdmin.successDescription").replace(
          "{email}",
          trimmedEmail,
        ),
      });
      setOpen(false);
    } catch (err) {
      const status = (err as ApiError | null)?.status;
      if (status === 409) {
        // Most likely a typo or an existing member: back to the form to fix it.
        setStep("form");
        setErrors({ email: t("admin.inviteAdmin.errorExists") });
        return;
      }
      toast({
        variant: "destructive",
        title: t("admin.inviteAdmin.errorTitle"),
        description:
          status === 403
            ? t("admin.inviteAdmin.errorForbidden")
            : apiErrorMessage(err, locale, t("common.tryAgain")),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-2">
          <UserPlus className="h-4 w-4" aria-hidden />
          {t("admin.inviteAdmin.button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "form"
              ? t("admin.inviteAdmin.title")
              : t("admin.inviteAdmin.reviewTitle")}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? t("admin.inviteAdmin.description")
              : t("admin.inviteAdmin.reviewBody").replace(
                  "{email}",
                  trimmedEmail,
                )}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form
            id="invite-admin-form"
            onSubmit={handleReview}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="invite-admin-name">
                {t("admin.inviteAdmin.nameLabel")}
              </Label>
              <Input
                id="invite-admin-name"
                autoComplete="off"
                maxLength={MAX_NAME_LENGTH}
                placeholder={t("admin.inviteAdmin.namePlaceholder")}
                value={fullName}
                aria-invalid={!!errors.fullName}
                aria-describedby={
                  errors.fullName ? "invite-admin-name-error" : undefined
                }
                onChange={(event) => setFullName(event.target.value)}
              />
              {errors.fullName && (
                <p
                  id="invite-admin-name-error"
                  className="text-xs text-destructive"
                >
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-admin-email">
                {t("admin.inviteAdmin.emailLabel")}
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="invite-admin-email"
                  type="email"
                  autoComplete="off"
                  className="pl-10"
                  placeholder={t("admin.inviteAdmin.emailPlaceholder")}
                  value={email}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "invite-admin-email-error" : undefined
                  }
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {errors.email && (
                <p
                  id="invite-admin-email-error"
                  className="text-xs text-destructive"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck
                className="mt-px h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden
              />
              <span>{t("admin.inviteAdmin.roleNote")}</span>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <dt className="text-muted-foreground">{t("admin.table.name")}</dt>
              <dd className="break-words text-foreground">{trimmedName}</dd>
              <dt className="text-muted-foreground">
                {t("admin.table.email")}
              </dt>
              <dd className="break-all font-medium text-foreground">
                {trimmedEmail}
              </dd>
              <dt className="text-muted-foreground">{t("admin.table.role")}</dt>
              <dd>
                <Badge variant="secondary">{roleLabel(t, "ADMIN")}</Badge>
              </dd>
            </dl>
            <p className="text-xs text-muted-foreground">
              {t("admin.inviteAdmin.linkNote")}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === "form" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" form="invite-admin-form">
                {t("admin.inviteAdmin.continue")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setStep("form")}
              >
                {t("admin.inviteAdmin.back")}
              </Button>
              <Button type="button" disabled={isPending} onClick={handleSend}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                )}
                {isPending
                  ? t("admin.inviteAdmin.sending")
                  : t("admin.inviteAdmin.send")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
