"use client";

import {
  Bell,
  BellOff,
  CircleCheck,
  CircleX,
  FileCheck2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
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

type NotificationTone = "info" | "positive" | "negative";

/**
 * How each backend event renders.
 *
 * The API stores an event code and its placeholders, never a sentence — so
 * the copy is chosen here, in the reader's own language, and a notification
 * written months ago still reads in whichever language they are using now.
 */
const EVENT_PRESENTATION: Record<
  NotificationEvent,
  { messageKey: string; tone: NotificationTone; icon: LucideIcon }
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
};

const TONE_CLASS: Record<NotificationTone, string> = {
  info: "bg-muted text-muted-foreground",
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  negative: "bg-destructive/10 text-destructive",
};

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

  return (
    <HoverCard openDelay={120} closeDelay={160}>
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
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card"
            />
          )}
          {/* The dot is decorative; the count belongs in the accessible name
              above, not only in a colour. */}
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
  // A deployed backend can be ahead of a cached client, so an event this
  // build has never heard of still renders as a dated, readable row rather
  // than a blank one — and clicking it still clears the badge.
  const presentation = EVENT_PRESENTATION[notification.event];
  const Icon = presentation?.icon ?? FileCheck2;
  const tone = presentation?.tone ?? "info";
  const message = presentation
    ? t(presentation.messageKey)
    : t("notifications.items.unknown");
  const isRead = notification.read_at !== null;

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
      </button>
    </li>
  );
}
