"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TONE_CLASS,
  presentNotification,
} from "@/components/notifications-panel";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-authentication";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";

/**
 * A large card at the top of the screen whenever there are unread
 * notifications.
 *
 * The bell sits at the very bottom of the sidebar, below where anyone looks,
 * and on a phone the sidebar is not shown at all — so an approval could land
 * and go unnoticed. This brings the message itself to the top of the page.
 *
 * Mounted once by the dashboard layout, outside the sidebar, so it shows on
 * every screen size. It reads the bell's own query (same key, no second
 * request) and live updates reach it through the bell's realtime hook.
 *
 * "Got it" marks the notifications read, so the card does not return. "Later"
 * only hides it for this visit: they stay unread and it comes back on the next
 * one.
 */
export function NewNotificationsAlert() {
  const { locale, t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { data } = useNotifications(Boolean(user));
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  // Hidden in this visit, by either button. Not persisted: "Got it" writes the
  // read state to the server, which is what keeps the card away for good.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());

  const fresh = (data?.items ?? []).filter(
    (item) => item.read_at === null && !hidden.has(item.id),
  );

  const hide = () =>
    setHidden((current) => {
      const next = new Set(current);
      for (const item of fresh) next.add(item.id);
      return next;
    });

  const acknowledge = () => {
    // One request when the card holds every unread notification; otherwise
    // only the ones actually shown, so nothing is marked read unseen.
    if (fresh.length === data?.unread) markAllRead();
    else for (const item of fresh) markRead(item.id);
    hide();
  };

  return (
    // Under the welcome cutscreen (z-70) and the tour (z-60), above the sticky
    // page header (z-50). The live region is always mounted so a screen reader
    // announces the card when it appears.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[55] flex justify-center px-4 pt-4"
    >
      <AnimatePresence>
        {fresh.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-primary/30 bg-card text-card-foreground shadow-2xl"
          >
            <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BellRing className="h-6 w-6" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="pt-0.5 text-base font-bold tracking-tight text-foreground sm:text-lg">
                  {fresh.length === 1
                    ? t("notifications.alert.titleOne")
                    : t("notifications.alert.titleMany", {
                        count: fresh.length,
                      })}
                </p>

                <ul className="mt-3 max-h-[40vh] space-y-2 overflow-y-auto">
                  {fresh.map((item) => {
                    const {
                      icon: Icon,
                      tone,
                      message,
                    } = presentNotification(item, t);
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                            TONE_CLASS[tone],
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground sm:text-base">
                            {message}
                          </p>
                          {item.created_at && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDateTime(item.created_at, locale)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={hide}>
                    {t("notifications.alert.later")}
                  </Button>
                  <Button size="sm" onClick={acknowledge}>
                    {t("notifications.alert.acknowledge")}
                  </Button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
