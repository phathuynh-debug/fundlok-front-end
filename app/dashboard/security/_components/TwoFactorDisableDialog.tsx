"use client";

import { useState } from "react";
import { Loader2, ShieldOff } from "lucide-react";

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
import { useDisableTwoFactor } from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";

/**
 * Turning 2FA off asks for the password AND a second factor.
 *
 * Not belt-and-braces: a session alone must not be able to strip the control
 * that exists to protect the account when a session or password leaks. The code
 * field accepts a recovery code as well as a live one, so losing the phone is
 * not a dead end.
 */
export function TwoFactorDisableDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { toast } = useToast();
  const { mutate: disable, isPending } = useDisableTwoFactor();

  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = (next: boolean) => {
    if (!next) {
      setPassword("");
      setCode("");
      setError(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    setError(null);
    disable(
      { password, code },
      {
        onSuccess: () => {
          toast({
            title: t("security.twoFactor.disabledTitle"),
            description: t("security.twoFactor.disabledDescription"),
          });
          close(false);
        },
        onError: (apiError) =>
          setError(apiError?.message ?? t("security.twoFactor.disableFailed")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-destructive" />
            {t("security.twoFactor.disableTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("security.twoFactor.disableDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Submit is on the button, not the form: an Enter keypress in the
            password field should not disable a security control. */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disable-password">
              {t("security.changePassword.currentLabel")}
            </Label>
            <Input
              id="disable-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disable-code">
              {t("security.twoFactor.disableCodeLabel")}
            </Label>
            <Input
              id="disable-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              placeholder="000000"
              className="font-mono"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t("security.twoFactor.disableCodeHint")}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || !password || !code}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("security.twoFactor.confirmDisable")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
