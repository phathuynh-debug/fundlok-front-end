"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LifeBuoy, LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLogout } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";

// Where a suspended account lands.
//
// The proxy sends every request here while the session is suspended, so this
// is the only page such a user can reach. It exists because the alternative is
// a loop: their cookie is valid, the backend refuses it, /login accepts their
// password and refuses anyway, and nothing ever says why.
//
// Deliberately says nothing about WHY the account was suspended. The operator
// records a reason in the audit log, but that is an internal note and may
// concern a fraud review — surfacing it here would leak the state of an
// investigation to its subject.
export function SuspendedClient() {
  const { t } = useTranslations();
  const { mutate: logout, isPending } = useLogout();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-lg"
      >
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("suspended.title")}
            </h1>
            <p className="leading-relaxed text-muted-foreground">
              {t("suspended.body")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-left">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("suspended.contactHint")}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="h-11 flex-1">
            <Link href="/contact">
              <LifeBuoy className="mr-2 h-4 w-4" />
              {t("suspended.contactBtn")}
            </Link>
          </Button>
          {/* Signing out clears the cookie, which is the only way off this
              page — every other route redirects straight back here. */}
          <Button
            variant="outline"
            className="h-11 flex-1"
            disabled={isPending}
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("suspended.signOutBtn")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
