import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NotificationsPanel } from "./notifications-panel";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

describe("NotificationsPanel", () => {
  it("puts the unread count in the accessible name, not only in a colour", () => {
    render(<NotificationsPanel />);
    // Two of the four sample notifications are unread.
    expect(
      screen.getByRole("button", {
        name: 'notifications.ariaLabelUnread:{"count":2}',
      }),
    ).toBeInTheDocument();
  });

  it("opens the panel on hover", async () => {
    render(<NotificationsPanel />);
    const trigger = screen.getByRole("button");

    expect(screen.queryByText("notifications.title")).toBeNull();
    await userEvent.hover(trigger);
    expect(await screen.findByText("notifications.title")).toBeInTheDocument();
  });

  it("also opens on keyboard focus, so the bell is not hover-only", async () => {
    render(<NotificationsPanel />);
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    expect(await screen.findByText("notifications.title")).toBeInTheDocument();
  });

  it("lists the notifications and says the data is sample", async () => {
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getByRole("button"));

    expect(
      await screen.findByText("notifications.items.repaymentReceived"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("notifications.items.gradeUpdated"),
    ).toBeInTheDocument();
    expect(screen.getByText("notifications.mockNotice")).toBeInTheDocument();
  });

  it("marking all read clears the unread badge", async () => {
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getByRole("button"));

    await userEvent.click(await screen.findByText("notifications.markAllRead"));

    expect(
      screen.getByRole("button", { name: "notifications.ariaLabel" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("notifications.markAllRead")).toBeNull();
  });
});
