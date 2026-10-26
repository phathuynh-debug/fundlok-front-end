"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  Bell,
  BellOff,
  CircleCheck,
  CircleX,
  FileCheck2,
  Loader2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useNotificationsRealtime } from "@/hooks/use-notifications-realtime";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import type {
  AppNotification,
  NotificationEvent,
} from "@/services/notifications.service";

// Notifications preview, opened by hovering the bell on the sidebar's user row.
//
// A hover card rather than a link to a page: there is no notifications route,
// and a preview is what this control is actually for — you check
// notifications, you do not configure them. Radix opens a hover card on FOCUS
// as well as hover, so the bell stays reachable by keyboard; it is a button
// rather than an anchor because it navigates nowhere.

/** How long the "you have a new notification" label stays beside the bell. */
const CALLOUT_MS = 5000;

type NotificationTone = "info" | "positive" | "negative" | "action";

/** Where a notification asks the reader to go, and the label that says so. */
interface NotificationAction {
  labelKey: string;
  href: string;
}

/**
 * How each backend event renders.
 *
 * The API stores an event code and its placeholders, never a sentence — so
 * the copy is chosen here, in the reader's own language, and a notification
 * written months ago still reads in whichever language they are using now.
 */
const EVENT_PRESENTATION: Record<
  NotificationEvent,
  {
    /** A fixed key, or one picked from the notification's placeholders. */
    messageKey: string | ((notification: AppNotification) => string);
    tone: NotificationTone;
    icon: LucideIcon;
    action?: NotificationAction;
  }
> = {
  APPLICATION_APPROVED: {
    messageKey: "notifications.items.applicationApproved",
    tone: "positive",
    icon: CircleCheck,
  },
  APPLICATION_REJECTED: {
    messageKey: "notifications.items.applicationRejected",
    tone: "negative",
    icon: CircleX,
  },
  // Written when the account picked its role; read once the verification is
  // submitted. `data.check` says which: an SME verifies the business (KYB),
  // an investor themselves (KYC). /kyc already opens the right one per role.
  VERIFICATION_REQUIRED: {
    messageKey: (notification) =>
      notification.data.check === "KYB"
        ? "notifications.items.verificationRequiredKyb"
        : "notifications.items.verificationRequiredKyc",
    tone: "action",
    icon: ShieldCheck,
    action: { labelKey: "notifications.actions.verify", href: "/kyc" },
  },
};

export const TONE_CLASS: Record<NotificationTone, string> = {
  info: "bg-muted text-muted-foreground",
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  negative: "bg-destructive/10 text-destructive",
  action: "bg-primary/10 text-primary",
};

/**
 * The icon, tone and sentence for one notification, shared by the bell's list
 * and the new-notifications alert.
 *
 * A deployed backend can be ahead of a cached client, so an event this build
 * has never heard of still renders as a dated, readable row rather than a
 * blank one.
 */
export function presentNotification(
  notification: AppNotification,
  t: (key: string) => string,
): {
  icon: LucideIcon;
  tone: NotificationTone;
  message: string;
  action?: NotificationAction;
} {
  const presentation = EVENT_PRESENTATION[notification.event];
  if (!presentation) {
    return {
      icon: FileCheck2,
      tone: "info",
      message: t("notifications.items.unknown"),
    };
  }
  const { messageKey } = presentation;
  return {
    icon: presentation.icon,
    tone: presentation.tone,
    message: t(
      typeof messageKey === "function" ? messageKey(notification) : messageKey,
    ),
    action: presentation.action,
  };
}

export function NotificationsPanel() {
  const { locale, t } = useTranslations();
  const { data: user } = useCurrentUser();
  // The sidebar mounts before the session resolves; asking for notifications
  // without one is a guaranteed 401.
  useNotificationsRealtime(user?.id);
  const { data, isLoading } = useNotifications(Boolean(user));
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const unread = data?.unread ?? 0;

  // The dot alone is easy to miss at the foot of the sidebar, so a label
  // slides out beside the bell for a few seconds whenever the unread count
  // goes up (a first load with something unread counts), then leaves the dot.
  // Adjusted during render rather than in an effect: it follows a change in
  // the data, not something to synchronise with.
  const [seenUnread, setSeenUnread] = useState(0);
  const [callout, setCallout] = useState({ id: 0, on: false });
  if (unread !== seenUnread) {
    setSeenUnread(unread);
    if (unread > seenUnread) {
      setCallout((current) => ({ id: current.id + 1, on: true }));
    }
  }
  // Restarts with each new arrival, since `callout` is a new object each time.
  useEffect(() => {
    if (!callout.on) return;
    const timer = setTimeout(
      () => setCallout((current) => ({ ...current, on: false })),
      CALLOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [callout]);
  const showCallout = callout.on && unread > 0;

  return (
    <div className="relative shrink-0">
      <HoverCard
        openDelay={120}
        closeDelay={160}
        // Opening the panel answers the label, so it goes.
        onOpenChange={(open) => {
          if (open) setCallout((current) => ({ ...current, on: false }));
        }}
      >
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label={
              unread > 0
                ? t("notifications.ariaLabelUnread", { count: unread })
                : t("notifications.ariaLabel")
            }
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer",
              CONTROL_IDLE,
            )}
          >
            {/* Rings once per arrival; keyed so the next one rings again. */}
            <m.span
              key={callout.id}
              className="flex"
              animate={
                showCallout ? { rotate: [0, -18, 14, -10, 6, 0] } : undefined
              }
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Bell className="h-[18px] w-[18px]" />
            </m.span>
            {unread > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card"
              />
            )}
            {/* The dot is decorative; the count belongs in the accessible
                name above, not only in a colour. */}
          </button>
        </HoverCardTrigger>

        {/* Opens to the right: the sidebar is pinned to the left edge, so a
          card on the default side would be clipped off-screen. */}
        <HoverCardContent
          side="right"
          align="end"
          sideOffset={12}
          className="w-80 p-0"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {t("notifications.title")}
            </p>
            {unread > 0 && (
              <button
                type="button"
                disabled={isMarkingAll}
                onClick={() => markAllRead()}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline cursor-pointer disabled:opacity-60"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <BellOff className="h-5 w-5 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                {t("notifications.empty")}
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  notification={item}
                  locale={locale}
                  t={t}
                  onRead={() => markRead(item.id)}
                />
              ))}
            </ul>
          )}
        </HoverCardContent>
      </HoverCard>

      {/* Out past the sidebar's edge, over the page, pointing back at the
          bell. Not interactive, and hidden from screen readers: the bell's
          own name already says how many are unread. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2"
      >
        <AnimatePresence>
          {showCallout && (
            <m.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg"
            >
              <span className="absolute -left-1 top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-primary" />
              {unread === 1
                ? t("notifications.alert.titleOne")
                : t("notifications.alert.titleMany", { count: unread })}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  locale,
  t,
  onRead,
}: {
  notification: AppNotification;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  onRead: () => void;
}) {
  // An unknown event still renders (see presentNotification), and clicking it
  // still clears the badge.
  const {
    icon: Icon,
    tone,
    message,
    action,
  } = presentNotification(notification, t);
  const isRead = notification.read_at !== null;

  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          TONE_CLASS[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{message}</p>
        {action && (
          <p className="mt-1 text-xs font-semibold text-primary">
            {t(action.labelKey)} →
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.created_at
            ? formatDateTime(notification.created_at, locale)
            : "—"}
        </p>
      </div>
      {!isRead && (
        <span
          aria-hidden="true"
          className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive"
        />
      )}
    </>
  );

  // A row that asks for something is a link, and following it does NOT mark
  // it read: the reminder is done when the thing is done (the API marks it
  // read on submission), not when it was clicked.
  if (action) {
    return (
      <li>
        <Link
          href={action.href}
          className={cn(
            "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/70",
            !isRead && "bg-muted/40",
          )}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        disabled={isRead}
        onClick={onRead}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left",
          !isRead && "bg-muted/40 cursor-pointer hover:bg-muted/70",
        )}
      >
        {content}
      </button>
    </li>
  );
}
