"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

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
import {
  useSetVerificationMode,
  useVerificationModeAdmin,
} from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { VerificationMode } from "@/services/admin.service";

// Who decides KYC/KYB: the verification provider (AUTOMATIC), or an admin
// reviewing the stored documents (MANUAL) while the provider is unavailable.
//
// The change is immediate and server-side — the very next submission follows
// it — so each option says what it does, and turning MANUAL on asks for
// confirmation: from then on no identity check happens unless someone works
// the review queue.

const OPTIONS: {
  mode: VerificationMode;
  icon: typeof ShieldCheck;
  titleKey:
    | "admin.system.verification.automaticTitle"
    | "admin.system.verification.manualTitle";
  bodyKey:
    | "admin.system.verification.automaticBody"
    | "admin.system.verification.manualBody";
}[] = [
  {
    mode: "AUTOMATIC",
    icon: ShieldCheck,
    titleKey: "admin.system.verification.automaticTitle",
    bodyKey: "admin.system.verification.automaticBody",
  },
  {
    mode: "MANUAL",
    icon: UserCheck,
    titleKey: "admin.system.verification.manualTitle",
    bodyKey: "admin.system.verification.manualBody",
  },
];

export function VerificationModeCard() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { data, isLoading, isError } = useVerificationModeAdmin();
  const { mutateAsync: setMode, isPending } = useSetVerificationMode();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const current = data?.mode;

  const apply = async (mode: VerificationMode) => {
    try {
      await setMode(mode);
      toast({
        title:
          mode === "MANUAL"
            ? t("admin.system.verification.savedManual")
            : t("admin.system.verification.savedAutomatic"),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.system.verification.error"),
        description: apiErrorMessage(err, locale, t("common.tryAgain")),
      });
    }
  };

  const choose = (mode: VerificationMode) => {
    if (mode === current || isPending) return;
    if (mode === "MANUAL") {
      setConfirmOpen(true);
      return;
    }
    void apply(mode);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {t("admin.system.verification.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.system.verification.description")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {t("admin.system.verification.loadFailed")}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div
            role="radiogroup"
            aria-label={t("admin.system.verification.title")}
            className="grid gap-3 sm:grid-cols-2"
          >
            {OPTIONS.map(({ mode, icon: Icon, titleKey, bodyKey }) => {
              const selected = current === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isPending}
                  onClick={() => choose(mode)}
                  className={cn(
                    "flex flex-col gap-2 rounded-md border p-4 text-left transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                    isPending && "cursor-wait opacity-70",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon className="h-4 w-4" aria-hidden />
                      {t(titleKey)}
                    </span>
                    {selected && (
                      <CheckCircle2
                        className="h-4 w-4 text-primary"
                        aria-hidden
                      />
                    )}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {t(bodyKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {current === "MANUAL" && (
            <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-foreground">
              <AlertTriangle
                className="mt-px h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <span>
                {t("admin.system.verification.manualActive")}{" "}
                <Link
                  href="/admin/kyc-reviews"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  {t("admin.system.verification.openQueue")}
                </Link>
              </span>
            </p>
          )}

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {data.updated_at
              ? t("admin.system.verification.lastChanged").replace(
                  "{date}",
                  formatDateTime(data.updated_at, locale),
                )
              : t("admin.system.verification.neverChanged")}
          </p>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.system.verification.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.system.verification.confirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void apply("MANUAL");
              }}
            >
              {t("admin.system.verification.confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
