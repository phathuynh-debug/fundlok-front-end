import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NotificationsPanel } from "./notifications-panel";
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

vi.mock("@/hooks/use-notifications-realtime", () => ({
  useNotificationsRealtime: vi.fn(),
}));

const markRead = vi.fn();
const markAllRead = vi.fn();
let listResult: { data: NotificationList | undefined; isLoading: boolean };

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => listResult,
  useMarkNotificationRead: () => ({ mutate: markRead }),
  useMarkAllNotificationsRead: () => ({
    mutate: markAllRead,
    isPending: false,
  }),
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
    isLoading: false,
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

describe("NotificationsPanel", () => {
  it("puts the unread count in the accessible name, not only in a colour", () => {
    render(<NotificationsPanel />);
    expect(
      screen.getByRole("button", {
        name: 'notifications.ariaLabelUnread:{"count":1}',
      }),
    ).toBeInTheDocument();
  });

  it("takes the unread count from the API, not from the page it rendered", () => {
    // The badge counts every unread notification; the list is only the most
    // recent page, so counting rows here would under-report.
    listResult.data = { items: [notification()], unread: 7 };
    render(<NotificationsPanel />);
    expect(
      screen.getByRole("button", {
        name: 'notifications.ariaLabelUnread:{"count":7}',
      }),
    ).toBeInTheDocument();
  });

  it("opens the panel on hover", async () => {
    render(<NotificationsPanel />);
    const trigger = screen.getAllByRole("button")[0];

    expect(screen.queryByText("notifications.title")).toBeNull();
    await userEvent.hover(trigger);
    expect(await screen.findByText("notifications.title")).toBeInTheDocument();
  });

  it("also opens on keyboard focus, so the bell is not hover-only", async () => {
    render(<NotificationsPanel />);
    await userEvent.tab();
    expect(screen.getAllByRole("button")[0]).toHaveFocus();
    expect(await screen.findByText("notifications.title")).toBeInTheDocument();
  });

  it("renders the copy for each event rather than stored text", async () => {
    // The API sends an event code and its placeholders; the sentence is
    // chosen here so it lands in the reader's own language.
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    expect(
      await screen.findByText("notifications.items.applicationApproved"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("notifications.items.applicationRejected"),
    ).toBeInTheDocument();
  });

  it("falls back to generic copy for an event this build does not know", async () => {
    // A deployed backend can be ahead of a cached client. A blank row would
    // be worse than a vague one.
    listResult.data = {
      items: [
        notification({
          event: "SOMETHING_NEW" as NotificationList["items"][0]["event"],
        }),
      ],
      unread: 1,
    };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    expect(
      await screen.findByText("notifications.items.unknown"),
    ).toBeInTheDocument();
  });

  it("marks one read when its row is clicked", async () => {
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    await userEvent.click(
      await screen.findByText("notifications.items.applicationApproved"),
    );
    expect(markRead).toHaveBeenCalledWith("n1");
  });

  it("does not re-mark a notification that is already read", async () => {
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    await userEvent.click(
      await screen.findByText("notifications.items.applicationRejected"),
    );
    expect(markRead).not.toHaveBeenCalled();
  });

  it("marks everything read from the header", async () => {
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    await userEvent.click(await screen.findByText("notifications.markAllRead"));
    expect(markAllRead).toHaveBeenCalled();
  });

  it("offers nothing to mark when there is nothing unread", async () => {
    listResult.data = {
      items: [notification({ read_at: "2026-09-20" })],
      unread: 0,
    };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    await screen.findByText("notifications.title");
    expect(screen.queryByText("notifications.markAllRead")).toBeNull();
  });

  it("says so when the list is empty", async () => {
    listResult.data = { items: [], unread: 0 };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    expect(await screen.findByText("notifications.empty")).toBeInTheDocument();
  });
});
