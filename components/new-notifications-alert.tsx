"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { ArrowRight, BellRing } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TONE_CLASS,
  presentNotification,
} from "@/components/notifications-panel";
import { useProductTourControls } from "@/components/product-tour";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-authentication";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { useFirstRunStatus } from "@/hooks/use-product-tour";
import type { AppNotification } from "@/services/notifications.service";

/**
 * A dialog in the middle of the screen whenever there are unread
 * notifications.
 *
 * The bell sits at the very bottom of the sidebar, below where anyone looks,
 * and on a phone the sidebar is not shown at all — so an approval could land
 * and go unnoticed. This brings the message itself to the centre of the page.
 *
 * Mounted once by the dashboard layout, outside the sidebar, so it shows on
 * every screen size. It reads the bell's own query (same key, no second
 * request) and live updates reach it through the bell's realtime hook.
 *
 * "Got it" marks the notifications read, so it does not return. "Later" (and
 * Escape, or a click outside) only hides it for this visit: they stay unread
 * and it comes back on the next one.
 */
export function NewNotificationsAlert() {
  const { locale, t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { data } = useNotifications(Boolean(user));
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  // A modal opened over the first-run welcome or the tour would take the page
  // from them (focus trap, everything else inert) — and a brand-new account
  // always has the "verify first" reminder waiting. So it holds until the
  // account has been through both.
  const { status: firstRun } = useFirstRunStatus();
  const { isOpen: tourOpen } = useProductTourControls();
  const ready = firstRun === "seen" && !tourOpen;

  // Hidden in this visit, by either button. Not persisted: "Got it" writes the
  // read state to the server, which is what keeps it away for good.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());

  const fresh = (data?.items ?? []).filter(
    (item) => item.read_at === null && !hidden.has(item.id),
  );

  // What the dialog shows. It lags `fresh` on the way out, so the closing
  // animation fades the notifications that were there, not an empty card.
  const freshKey = fresh.map((item) => item.id).join(",");
  const [shown, setShown] = useState<{
    key: string;
    items: AppNotification[];
  }>({ key: "", items: [] });
  if (freshKey && freshKey !== shown.key) {
    setShown({ key: freshKey, items: fresh });
  }

  const hide = () =>
    setHidden((current) => {
      const next = new Set(current);
      for (const item of fresh) next.add(item.id);
      return next;
    });

  const acknowledge = () => {
    // One request when the dialog holds every unread notification; otherwise
    // only the ones actually shown, so nothing is marked read unseen.
    if (fresh.length === data?.unread) markAllRead();
    else for (const item of fresh) markRead(item.id);
    hide();
  };

  const count = shown.items.length;

  return (
    <Dialog
      open={ready && fresh.length > 0}
      onOpenChange={(open) => {
        if (!open) hide();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-3xl border-primary/20 bg-card p-0 text-card-foreground shadow-2xl sm:max-w-md"
      >
        {/* Brand glow behind the bell. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent"
        />

        <div className="relative flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary ring-8 ring-primary/5">
            <m.span
              className="flex"
              animate={{ rotate: [0, -16, 13, -9, 5, 0] }}
              transition={{
                duration: 0.9,
                ease: "easeInOut",
                delay: 0.25,
                repeat: 1,
                repeatDelay: 1.2,
              }}
            >
              <BellRing className="h-8 w-8" />
            </m.span>
          </span>

          <DialogTitle className="mt-5 text-balance text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            {count === 1
              ? t("notifications.alert.titleOne")
              : t("notifications.alert.titleMany", { count })}
          </DialogTitle>

          <DialogDescription asChild>
            <ul className="mt-5 flex max-h-[45vh] w-full flex-col gap-2.5 overflow-y-auto text-left">
              {shown.items.map((item) => {
                const {
                  icon: Icon,
                  tone,
                  message,
                  action,
                } = presentNotification(item, t);
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        TONE_CLASS[tone],
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium leading-snug text-foreground sm:text-base">
                        {message}
                      </p>
                      {item.created_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(item.created_at, locale)}
                        </p>
                      )}
                      {/* Leaving for it does not mark it read: the API does
                          that once the thing is done. */}
                      {action && (
                        <Button asChild size="sm" className="mt-3 rounded-full">
                          <Link href={action.href}>
                            {t(action.labelKey)}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </DialogDescription>

          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-full"
              onClick={hide}
            >
              {t("notifications.alert.later")}
            </Button>
            <Button className="h-11 rounded-full" onClick={acknowledge}>
              {t("notifications.alert.acknowledge")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
