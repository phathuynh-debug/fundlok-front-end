import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewNotificationsAlert } from "./new-notifications-alert";
import type { NotificationList } from "@/services/notifications.service";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => ({ data: { id: "u1", email: "sme@example.com" } }),
}));

const markRead = vi.fn();
const markAllRead = vi.fn();
let listResult: { data: NotificationList | undefined };

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => listResult,
  useMarkNotificationRead: () => ({ mutate: markRead }),
  useMarkAllNotificationsRead: () => ({ mutate: markAllRead }),
}));

const notification = (over: Partial<NotificationList["items"][0]> = {}) => ({
  id: "n1",
  event: "APPLICATION_APPROVED" as const,
  entity_type: "LOAN_APPLICATION",
  entity_id: "a1",
  data: {},
  read_at: null,
  created_at: "2026-09-20T09:12:00+07:00",
  ...over,
});

beforeEach(() => {
  markRead.mockClear();
  markAllRead.mockClear();
  listResult = {
    data: {
      items: [
        notification(),
        notification({
          id: "n2",
          event: "APPLICATION_REJECTED",
          read_at: "2026-09-20T10:00:00+07:00",
        }),
      ],
      unread: 1,
    },
  };
});

describe("NewNotificationsAlert", () => {
  it("shows an unread notification's message without opening the bell", () => {
    render(<NewNotificationsAlert />);
    expect(
      screen.getByText("notifications.alert.titleOne"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("notifications.items.applicationApproved"),
    ).toBeInTheDocument();
    // Already read: not news.
    expect(
      screen.queryByText("notifications.items.applicationRejected"),
    ).toBeNull();
  });

  it("counts several unread notifications in its title", () => {
    listResult.data = {
      items: [notification(), notification({ id: "n2" })],
      unread: 2,
    };
    render(<NewNotificationsAlert />);
    expect(
      screen.getByText('notifications.alert.titleMany:{"count":2}'),
    ).toBeInTheDocument();
  });

  it("renders nothing when everything is read", () => {
    listResult.data = {
      items: [notification({ read_at: "2026-09-20" })],
      unread: 0,
    };
    render(<NewNotificationsAlert />);
    expect(screen.queryByText("notifications.alert.titleOne")).toBeNull();
  });

  it("marks everything read in one request when it holds every unread one", async () => {
    render(<NewNotificationsAlert />);
    await userEvent.click(screen.getByText("notifications.alert.acknowledge"));

    expect(markAllRead).toHaveBeenCalled();
    expect(markRead).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText("notifications.alert.titleOne")).toBeNull(),
    );
  });

  it("marks only what it showed when more are unread than it holds", async () => {
    // The list is one page; the unread count covers every notification.
    listResult.data = { items: [notification()], unread: 5 };
    render(<NewNotificationsAlert />);
    await userEvent.click(screen.getByText("notifications.alert.acknowledge"));

    expect(markRead).toHaveBeenCalledWith("n1");
    expect(markAllRead).not.toHaveBeenCalled();
  });

  it("hides on Later without marking anything read", async () => {
    render(<NewNotificationsAlert />);
    await userEvent.click(screen.getByText("notifications.alert.later"));

    expect(markRead).not.toHaveBeenCalled();
    expect(markAllRead).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText("notifications.alert.titleOne")).toBeNull(),
    );
  });
});
