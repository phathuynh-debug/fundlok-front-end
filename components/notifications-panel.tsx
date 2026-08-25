"use client";

import { useState } from "react";
import {
  Banknote,
  Bell,
  BellOff,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
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

// Notifications preview, opened by hovering the bell on the sidebar's user row.
//
// A hover card rather than a link to a page: there is no notifications route
// (only /dashboard/settings/profile exists under settings), and a preview is
// what this control is actually for — you check notifications, you do not
// configure them. Radix opens a hover card on FOCUS as well as hover, so the
// bell stays reachable by keyboard; it is a button rather than an anchor
// because it navigates nowhere.
//
// The list is mock data. There is no notifications API, table or delivery
// pipeline yet, so this sits next to the component that renders it rather than
// pretending to be a service — same reasoning as the dashboard's other mocks.
// When the API lands: add NOTIFICATION_ENDPOINTS -> notifications.service.ts ->
// hooks/use-notifications.ts, move the type below into the service, and delete
// MOCK_NOTIFICATIONS.

type NotificationTone = "info" | "money" | "action";

interface AppNotification {
  id: string;
  /** i18n key suffix under `notifications.items`. */
  key: string;
  tone: NotificationTone;
  at: string;
  read: boolean;
}

const TONE_ICON: Record<NotificationTone, LucideIcon> = {
  info: FileCheck2,
  money: Banknote,
  action: ShieldCheck,
};

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "ntf-1",
    key: "repaymentReceived",
    tone: "money",
    at: "2026-08-18T09:12:00+07:00",
    read: false,
  },
  {
    id: "ntf-2",
    key: "newListing",
    tone: "info",
    at: "2026-08-18T07:40:00+07:00",
    read: false,
  },
  {
    id: "ntf-3",
    key: "newDevice",
    tone: "action",
    at: "2026-08-16T02:17:00+07:00",
    read: true,
  },
  {
    id: "ntf-4",
    key: "gradeUpdated",
    tone: "info",
    at: "2026-08-14T16:05:00+07:00",
    read: true,
  },
];

export function NotificationsPanel() {
  const { locale, t } = useTranslations();

  // Local only: with no endpoint there is nothing to persist a read state to,
  // so "mark all as read" clears the badge for this session and says so.
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unread = notifications.filter((item) => !item.read).length;

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
            <>
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card"
              />
              {/* The dot is decorative; the count belongs in the accessible
                  name above, not only in a colour. */}
            </>
          )}
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
              onClick={() =>
                setNotifications((current) =>
                  current.map((item) => ({ ...item, read: true })),
                )
              }
              className="text-xs text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellOff className="h-5 w-5 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {t("notifications.empty")}
            </p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.map((item) => {
              const Icon = TONE_ICON[item.tone];
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3",
                    !item.read && "bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      item.tone === "money"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : item.tone === "action"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {t(`notifications.items.${item.key}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(item.at, locale)}
                    </p>
                  </div>
                  {!item.read && (
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Same honesty as the dashboard's other mocked surfaces: the list is
            sample data until a notifications API exists. */}
        <div className="flex items-start gap-2 border-t border-border px-4 py-2.5">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            {t("notifications.mockNotice")}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
