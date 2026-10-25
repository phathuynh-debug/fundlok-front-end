"use client";

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
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

/**
 * Asked before sign-in alerts go off; turning them on needs no confirmation.
 *
 * Alerts are on by default, so switching them off is a deliberate step away
 * from the protection, and it is also what someone who has taken over the
 * account would do first. The warning says what is lost rather than just
 * "are you sure".
 */
export function LoginAlertsOffDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("dashboard.security.protections.loginAlertsOff.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("dashboard.security.protections.loginAlertsOff.body")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("dashboard.security.protections.loginAlertsOff.keep")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {t("dashboard.security.protections.loginAlertsOff.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
