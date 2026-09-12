"use client";

import { useState } from "react";
import { Fingerprint, Loader2, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  useDeletePasskey,
  usePasskeys,
  useRegisterPasskey,
} from "@/hooks/use-authentication";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { isPasskeyCancellation, isPasskeySupported } from "@/lib/passkeys";

/**
 * Add and remove passkeys.
 *
 * One dialog for both, rather than a setup wizard like 2FA: registering a
 * passkey is a single browser prompt with nothing to copy down, so the useful
 * screen is the list of devices — which is also the only place someone can
 * revoke the phone they just lost.
 */
export function PasskeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale, t } = useTranslations();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const { data: passkeys, isPending } = usePasskeys(open);
  const register = useRegisterPasskey();
  const remove = useDeletePasskey();

  const supported = isPasskeySupported();

  const handleAdd = () => {
    register.mutate(name.trim() || undefined, {
      onSuccess: (created) => {
        setName("");
        toast({
          title: t("dashboard.security.passkeys.addedTitle"),
          description: t("dashboard.security.passkeys.addedBody", {
            name: created.name,
          }),
        });
      },
      onError: (error) => {
        // Dismissing the system prompt is not a failure, and a red toast for
        // it trains people to ignore red toasts.
        if (isPasskeyCancellation(error)) return;
        toast({
          variant: "destructive",
          title: t("dashboard.security.passkeys.addFailedTitle"),
          description: error?.message,
        });
      },
    });
  };

  const handleRemove = (id: string, label: string) => {
    remove.mutate(id, {
      onSuccess: () =>
        toast({
          title: t("dashboard.security.passkeys.removedTitle"),
          description: t("dashboard.security.passkeys.removedBody", {
            name: label,
          }),
        }),
      onError: (error) =>
        toast({
          variant: "destructive",
          title: t("dashboard.security.passkeys.removeFailedTitle"),
          description: error?.message,
        }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            {t("dashboard.security.passkeys.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dashboard.security.passkeys.description")}
          </DialogDescription>
        </DialogHeader>

        {!supported ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {t("dashboard.security.passkeys.unsupported")}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Registered devices */}
            <div className="space-y-2">
              {isPending ? (
                <p className="text-sm text-muted-foreground">
                  {t("common.loading")}
                </p>
              ) : passkeys && passkeys.length > 0 ? (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {passkeys.map((passkey) => (
                    <li
                      key={passkey.id}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {passkey.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {passkey.last_used_at
                            ? t("dashboard.security.passkeys.lastUsed", {
                                date: formatDate(passkey.last_used_at, locale),
                              })
                            : t("dashboard.security.passkeys.neverUsed")}
                          {/* A synced passkey survives losing the device; a
                              single-device one does not. That difference is
                              the whole recovery story, so it is on screen. */}
                          {passkey.backed_up
                            ? ` · ${t("dashboard.security.passkeys.synced")}`
                            : ` · ${t("dashboard.security.passkeys.thisDevice")}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("dashboard.security.passkeys.remove", {
                          name: passkey.name,
                        })}
                        disabled={remove.isPending}
                        onClick={() => handleRemove(passkey.id, passkey.name)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("dashboard.security.passkeys.empty")}
                </p>
              )}
            </div>

            {/* Add a new one */}
            <div className="space-y-2 border-t border-border pt-4">
              <label
                htmlFor="passkey-name"
                className="text-sm font-medium text-foreground"
              >
                {t("dashboard.security.passkeys.nameLabel")}
              </label>
              <div className="flex gap-2">
                <Input
                  id="passkey-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("dashboard.security.passkeys.namePlaceholder")}
                  maxLength={80}
                  disabled={register.isPending}
                />
                <Button
                  onClick={handleAdd}
                  disabled={register.isPending}
                  className="shrink-0 gap-1.5"
                >
                  {register.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t("dashboard.security.passkeys.add")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.security.passkeys.nameHint")}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
