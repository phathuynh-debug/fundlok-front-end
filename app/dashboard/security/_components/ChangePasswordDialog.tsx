"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { apiErrorMessage } from "@/lib/api-error-message";

const MIN_LENGTH = 8;

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { mutate: changePassword, isPending } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  // Client-side checks are for immediate feedback only — the backend enforces
  // all of these, plus "must differ from the current password", which it can
  // check and we cannot.
  const validate = (): string | null => {
    if (!currentPassword) return t("security.changePassword.errorCurrent");
    if (newPassword.length < MIN_LENGTH)
      return t("security.changePassword.errorLength", { min: MIN_LENGTH });
    if (newPassword !== confirmPassword)
      return t("security.changePassword.errorMismatch");
    return null;
  };

  const handleSubmit = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);

    changePassword(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: (result) => {
          toast({
            title: t("security.changePassword.successTitle"),
            // The count matters: the change signed other devices out, and a
            // user who does not expect that will think something broke.
            description: t("security.changePassword.successDescription", {
              count: result.sessions_revoked,
            }),
          });
          reset();
          onOpenChange(false);
        },
        onError: (apiError) =>
          setError(
            apiErrorMessage(
              apiError,
              locale,
              t("security.changePassword.errorGeneric"),
            ),
          ),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("security.changePassword.title")}</DialogTitle>
          <DialogDescription>
            {t("security.changePassword.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Submit is wired to the button, not the form: an Enter keypress in
            any field should not fire an irreversible change before the user
            has filled the rest in. */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {t("security.changePassword.currentLabel")}
            </Label>
            <Input
              id="currentPassword"
              type={showPasswords ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t("security.changePassword.newLabel")}
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPasswords((shown) => !shown)}
                aria-label={t(
                  showPasswords
                    ? "security.changePassword.hide"
                    : "security.changePassword.show",
                )}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("security.changePassword.hint", { min: MIN_LENGTH })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("security.changePassword.confirmLabel")}
            </Label>
            <Input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {t("security.changePassword.revokeNotice")}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("security.changePassword.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
