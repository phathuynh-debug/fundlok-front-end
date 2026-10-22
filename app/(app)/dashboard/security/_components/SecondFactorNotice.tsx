"use client";

import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useLogout } from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";

/**
 * Shown to an admin whose session was opened without a second factor (see
 * lib/second-factor.ts). lib/api-client.ts sends them here from any page whose
 * calls the backend refuses.
 *
 * Two cases, because enrolling does not upgrade the session: an admin with no
 * factor yet is told to set one up below; one who has a factor (just enrolled,
 * or signed in without using it) has to sign out and sign in again with it,
 * so that case carries the button.
 */
export function SecondFactorNotice({
  hasSecondFactor,
}: {
  hasSecondFactor: boolean;
}) {
  const { t } = useTranslations();
  const { mutate: logout, isPending } = useLogout();

  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {t("security.secondFactorRequired.title")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {hasSecondFactor
              ? t("security.secondFactorRequired.signInAgainBody")
              : t("security.secondFactorRequired.setupBody")}
          </p>
        </div>
      </div>

      {hasSecondFactor && (
        <Button
          onClick={() => logout()}
          disabled={isPending}
          className="shrink-0 gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {t("security.secondFactorRequired.signInAgain")}
        </Button>
      )}
    </div>
  );
}

/**
 * The success toast for enrolling a factor on such a session. The usual
 * "you'll be asked next time" copy would leave the admin on a locked admin
 * area, so it says to sign in again and carries the button to do it.
 */
export function useSignInAgainToast() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const { mutate: logout } = useLogout();

  return (title: string) =>
    toast({
      title,
      description: t("security.secondFactorRequired.toastBody"),
      action: (
        <ToastAction
          altText={t("security.secondFactorRequired.signInAgain")}
          onClick={() => logout()}
        >
          {t("security.secondFactorRequired.signInAgain")}
        </ToastAction>
      ),
    });
}
