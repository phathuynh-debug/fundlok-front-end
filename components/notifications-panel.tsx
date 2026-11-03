"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  Banknote,
  Bell,
  ReceiptText,
  BellOff,
  CircleCheck,
  CircleX,
  FileCheck2,
  Loader2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER, CONTROL_IDLE } from "@/lib/ui-tokens";
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
  NotificationList,
} from "@/services/notifications.service";

// Notifications preview, opened by hovering the bell on the sidebar's user row
// (NotificationsPanel), or by tapping the bell in the header on a phone, where
// the sidebar is hidden (NotificationsPopover).
//
// A preview rather than a link to a page: there is no notifications route,
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
    /** The `{placeholders}` the copy names, formatted for the reader. */
    values?: (
      notification: AppNotification,
      locale: string,
    ) => Record<string, string | number>;
    tone: NotificationTone;
    icon: LucideIcon;
    /** Fixed, or built from the notification (a link to what it is about). */
    action?:
      | NotificationAction
      | ((notification: AppNotification) => NotificationAction);
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
  // To the business: staff approved an investor's transfer to its account.
  // ACTIVE: received, and the business repays that investor from the next
  // working day. CONFIRMED: received. ATTESTED (older approvals) still left two
  // working days to say the money never arrived, so that copy says so.
  INVESTMENT_TRANSFER_APPROVED: {
    messageKey: (notification) =>
      notification.data.status === "ACTIVE"
        ? "notifications.items.transferRepaying"
        : notification.data.status === "CONFIRMED"
          ? "notifications.items.transferConfirmed"
          : "notifications.items.transferApproved",
    values: (notification, locale) => ({
      amount: formatCurrency(Number(notification.data.amount_vnd ?? 0), locale),
      memo: String(notification.data.memo ?? ""),
      investor: String(notification.data.investor ?? ""),
    }),
    tone: "positive",
    icon: Banknote,
  },
  // Staff could not confirm a repayment from the receipt the business sent:
  // those days are due again, paid from the investment's page.
  REPAYMENT_RECEIPT_REJECTED: {
    messageKey: "notifications.items.repaymentReceiptRejected",
    values: (notification, locale) => ({
      amount: formatCurrency(Number(notification.data.amount_vnd ?? 0), locale),
      investor: String(notification.data.investor ?? ""),
      reason: String(notification.data.reason ?? ""),
    }),
    tone: "negative",
    icon: ReceiptText,
    action: (notification) => ({
      labelKey: "notifications.actions.payAgain",
      href: `/dashboard/repayments/${String(notification.data.tranche_id ?? "")}`,
    }),
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
  t: (key: string, values?: Record<string, string | number>) => string,
  locale = "vi",
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
      presentation.values?.(notification, locale),
    ),
    action:
      typeof presentation.action === "function"
        ? presentation.action(notification)
        : presentation.action,
  };
}

/**
 * Whether the bell is announcing an arrival right now.
 *
 * Switches on whenever the unread count goes up (a first load with something
 * unread counts) and off again after CALLOUT_MS, or as soon as the list is
 * opened. `id` changes with each arrival, which re-keys the bell so it rings
 * again. Adjusted during render rather than in an effect: it follows a change
 * in the data, not something to synchronise with.
 */
function useArrivalCallout(unread: number) {
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
  return {
    id: callout.id,
    show: callout.on && unread > 0,
    dismiss: () => setCallout((current) => ({ ...current, on: false })),
  };
}

function bellLabel(
  t: (key: string, values?: Record<string, string | number>) => string,
  unread: number,
) {
  return unread > 0
    ? t("notifications.ariaLabelUnread", { count: unread })
    : t("notifications.ariaLabel");
}

/** The bell icon, its ring on arrival, and the unread dot. */
function BellGlyph({
  unread,
  callout,
  dotRingClass,
}: {
  unread: number;
  callout: { id: number; show: boolean };
  /** The surface behind the bell, so the dot's ring cuts it out cleanly. */
  dotRingClass: string;
}) {
  return (
    <>
      {/* Rings once per arrival; keyed so the next one rings again. */}
      <m.span
        key={callout.id}
        className="flex"
        animate={callout.show ? { rotate: [0, -18, 14, -10, 6, 0] } : undefined}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <Bell className="h-[18px] w-[18px]" />
      </m.span>
      {unread > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2",
            dotRingClass,
          )}
        />
      )}
      {/* The dot is decorative; the count belongs in the accessible name on
          the button, not only in a colour. */}
    </>
  );
}

/** The list both bells open: a title row, then the notifications. */
function NotificationsList({
  data,
  isLoading,
  onNavigate,
}: {
  data: NotificationList | undefined;
  isLoading: boolean;
  /** Called when a row's link is followed, so a tap-opened list can close. */
  onNavigate?: () => void;
}) {
  const { locale, t } = useTranslations();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <>
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
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </>
  );
}

export function NotificationsPanel() {
  const { t } = useTranslations();
  const { data: user } = useCurrentUser();
  // The sidebar mounts before the session resolves; asking for notifications
  // without one is a guaranteed 401.
  //
  // The one live connection for the whole dashboard. The sidebar is only
  // hidden by CSS below `md`, so it is mounted on a phone too, and the header
  // bell and NewNotificationsAlert read the query this keeps fresh.
  useNotificationsRealtime(user?.id);
  const { data, isLoading } = useNotifications(Boolean(user));
  const unread = data?.unread ?? 0;

  // The dot alone is easy to miss at the foot of the sidebar, so a label
  // slides out beside the bell for a few seconds whenever the unread count
  // goes up, then leaves the dot.
  const callout = useArrivalCallout(unread);

  return (
    <div className="relative shrink-0">
      <HoverCard
        openDelay={120}
        closeDelay={160}
        // Opening the panel answers the label, so it goes.
        onOpenChange={(open) => {
          if (open) callout.dismiss();
        }}
      >
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label={bellLabel(t, unread)}
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer",
              CONTROL_IDLE,
            )}
          >
            <BellGlyph
              unread={unread}
              callout={callout}
              dotRingClass="ring-card"
            />
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
          <NotificationsList data={data} isLoading={isLoading} />
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
          {callout.show && (
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

/**
 * The bell for the dashboard header below `md`, where the sidebar and the bell
 * on its user row are hidden.
 *
 * The same list, opened by a tap: a hover card never opens from touch. It
 * reads the sidebar bell's query (same key, no second request) and adds no
 * realtime connection of its own, since that bell is still mounted and holds
 * it. No slide-out label: there is no room beside it in the header, and
 * NewNotificationsAlert already brings an arrival to the middle of the screen.
 */
export function NotificationsPopover() {
  const { t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { data, isLoading } = useNotifications(Boolean(user));
  const unread = data?.unread ?? 0;
  const callout = useArrivalCallout(unread);
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) callout.dismiss();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={bellLabel(t, unread)}
          className={cn("relative h-9 w-9 rounded-full", CONTROL_HOVER)}
        >
          <BellGlyph
            unread={unread}
            callout={callout}
            dotRingClass="ring-background"
          />
        </Button>
      </PopoverTrigger>
      {/* Capped at the viewport so a 320px phone still fits it whole. */}
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={8}
        className="w-[min(20rem,calc(100vw-1rem))] p-0"
      >
        <NotificationsList
          data={data}
          isLoading={isLoading}
          onNavigate={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  notification,
  locale,
  t,
  onRead,
  onNavigate,
}: {
  notification: AppNotification;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  onRead: () => void;
  onNavigate?: () => void;
}) {
  // An unknown event still renders (see presentNotification), and clicking it
  // still clears the badge.
  const {
    icon: Icon,
    tone,
    message,
    action,
  } = presentNotification(notification, t, locale);
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
          onClick={onNavigate}
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
