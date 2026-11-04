import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  NotificationsPanel,
  NotificationsPopover,
} from "./notifications-panel";
import { useNotificationsRealtime } from "@/hooks/use-notifications-realtime";
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

describe("NotificationsPanel — verification reminder", () => {
  const reminder = (check: "KYC" | "KYB") =>
    notification({
      id: "r1",
      event: "VERIFICATION_REQUIRED",
      entity_type: "USER",
      entity_id: "u1",
      data: { check },
    });

  it.each([
    ["KYB", "notifications.items.verificationRequiredKyb"],
    ["KYC", "notifications.items.verificationRequiredKyc"],
  ] as const)("words a %s reminder for that check", async (check, copy) => {
    listResult.data = { items: [reminder(check)], unread: 1 };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    expect(await screen.findByText(copy)).toBeInTheDocument();
  });

  it("links to verification without marking the reminder read", async () => {
    // The API marks it read once the verification is submitted; a click
    // alone has not done what it asks.
    listResult.data = { items: [reminder("KYB")], unread: 1 };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    const link = await screen.findByRole("link", {
      name: /notifications\.items\.verificationRequiredKyb/,
    });
    expect(link).toHaveAttribute("href", "/kyc");
    await userEvent.click(link);
    expect(markRead).not.toHaveBeenCalled();
  });
});

describe("NotificationsPanel — transfer approved", () => {
  const approved = (status: "ATTESTED" | "CONFIRMED" | "ACTIVE") =>
    notification({
      id: "t1",
      event: "INVESTMENT_TRANSFER_APPROVED",
      entity_type: "TRANCHE",
      entity_id: "tr1",
      data: {
        status,
        amount_vnd: 10_000_000,
        memo: "FL8TKK1UAQ",
        investor: "P. H***",
        project: "Delta Foods",
      },
    });

  it.each([
    ["ATTESTED", "notifications.items.transferApproved"],
    ["CONFIRMED", "notifications.items.transferConfirmed"],
    ["ACTIVE", "notifications.items.transferRepaying"],
  ] as const)(
    "tells the business of a %s transfer, naming the amount and memo",
    async (status, copy) => {
      listResult.data = { items: [approved(status)], unread: 1 };
      render(<NotificationsPanel />);
      await userEvent.hover(screen.getAllByRole("button")[0]);

      const message = await screen.findByText((text) =>
        text.startsWith(`${copy}:`),
      );
      expect(message.textContent).toContain('"memo":"FL8TKK1UAQ"');
      expect(message.textContent).toContain('"investor":"P. H***"');
      expect(message.textContent).toContain("10,000,000"); // formatted for the reader
    },
  );
});

describe("NotificationsPanel — repayment receipt rejected", () => {
  it("tells the business why, and links to the investment to pay again", async () => {
    listResult.data = {
      items: [
        notification({
          id: "r1",
          event: "REPAYMENT_RECEIPT_REJECTED",
          entity_type: "TRANCHE",
          entity_id: "tr1",
          data: {
            tranche_id: "tr1",
            memo: "FL8TKK1UAQ",
            investor: "P. H***",
            amount_vnd: 121_875,
            reason: "Wrong amount",
          },
        }),
      ],
      unread: 1,
    };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    const link = await screen.findByRole("link", {
      name: /notifications\.items\.repaymentReceiptRejected/,
    });
    expect(link).toHaveAttribute("href", "/dashboard/repayments/tr1");
    expect(link.textContent).toContain('"reason":"Wrong amount"');
    expect(link.textContent).toContain("121,875");
  });
});

describe("NotificationsPanel — repayment receipt submitted & confirmed", () => {
  it("tells the investor a business uploaded a receipt and links to the dashboard", async () => {
    listResult.data = {
      items: [
        notification({
          id: "rs1",
          event: "REPAYMENT_RECEIPT_SUBMITTED",
          entity_type: "TRANCHE",
          entity_id: "tr1",
          data: {
            tranche_id: "tr1",
            receipt_id: "rc1",
            memo: "FL8TKK1UAQ",
            project: "Delta Foods",
            amount_vnd: 140_875,
          },
        }),
      ],
      unread: 1,
    };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    const link = await screen.findByRole("link", {
      name: /notifications\.items\.repaymentReceiptSubmitted/,
    });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link.textContent).toContain('"project":"Delta Foods"');
    expect(link.textContent).toContain('"memo":"FL8TKK1UAQ"');
    expect(link.textContent).toContain("140,875");
  });

  it("tells the business the investor confirmed receiving the repayment", async () => {
    listResult.data = {
      items: [
        notification({
          id: "rc1",
          event: "REPAYMENT_RECEIPT_CONFIRMED",
          entity_type: "TRANCHE",
          entity_id: "tr1",
          data: {
            tranche_id: "tr1",
            memo: "FL8TKK1UAQ",
            investor: "N. A***",
            amount_vnd: 140_875,
          },
        }),
      ],
      unread: 1,
    };
    render(<NotificationsPanel />);
    await userEvent.hover(screen.getAllByRole("button")[0]);

    const message = await screen.findByText((text) =>
      text.startsWith("notifications.items.repaymentReceiptConfirmed:"),
    );
    expect(message.textContent).toContain('"investor":"N. A***"');
    expect(message.textContent).toContain('"memo":"FL8TKK1UAQ"');
    expect(message.textContent).toContain("140,875");
  });
});

describe("NotificationsPanel — new-notification label", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("says so beside the bell when something is unread", () => {
    render(<NotificationsPanel />);
    expect(
      screen.getByText("notifications.alert.titleOne"),
    ).toBeInTheDocument();
  });

  it("counts several", () => {
    listResult.data = {
      items: [notification(), notification({ id: "n3" })],
      unread: 2,
    };
    render(<NotificationsPanel />);
    expect(
      screen.getByText('notifications.alert.titleMany:{"count":2}'),
    ).toBeInTheDocument();
  });

  it("stays quiet when nothing is unread", () => {
    listResult.data = {
      items: [notification({ read_at: "2026-09-20" })],
      unread: 0,
    };
    render(<NotificationsPanel />);
    expect(screen.queryByText("notifications.alert.titleOne")).toBeNull();
  });

  it("goes after a few seconds and leaves the dot", () => {
    vi.useFakeTimers();
    render(<NotificationsPanel />);
    expect(
      screen.getByText("notifications.alert.titleOne"),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("notifications.alert.titleOne")).toBeNull();
    // Still unread: only the label went.
    expect(
      screen.getByRole("button", {
        name: 'notifications.ariaLabelUnread:{"count":1}',
      }),
    ).toBeInTheDocument();
  });

  it("comes back when another one arrives", () => {
    vi.useFakeTimers();
    const { rerender } = render(<NotificationsPanel />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    listResult.data = {
      items: [notification({ id: "n3" }), notification()],
      unread: 2,
    };
    rerender(<NotificationsPanel />);

    expect(
      screen.getByText('notifications.alert.titleMany:{"count":2}'),
    ).toBeInTheDocument();
  });
});

describe("NotificationsPopover (header bell on a phone)", () => {
  beforeEach(() => {
    vi.mocked(useNotificationsRealtime).mockClear();
  });

  it("puts the unread count in the accessible name", () => {
    render(<NotificationsPopover />);
    expect(
      screen.getByRole("button", {
        name: 'notifications.ariaLabelUnread:{"count":1}',
      }),
    ).toBeInTheDocument();
  });

  it("opens the list on a tap, since a hover card never opens from touch", async () => {
    render(<NotificationsPopover />);

    expect(screen.queryByText("notifications.title")).toBeNull();
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByText("notifications.title")).toBeInTheDocument();
    expect(
      screen.getByText("notifications.items.applicationApproved"),
    ).toBeInTheDocument();
  });

  it("closes when a row's link is followed", async () => {
    // The header outlives a client-side navigation, so the list would
    // otherwise stay open over the page it led to.
    listResult.data = {
      items: [
        notification({
          id: "r1",
          event: "VERIFICATION_REQUIRED",
          entity_type: "USER",
          entity_id: "u1",
          data: { check: "KYC" },
        }),
      ],
      unread: 1,
    };
    render(<NotificationsPopover />);
    await userEvent.click(screen.getByRole("button"));

    await userEvent.click(
      await screen.findByRole("link", {
        name: /notifications\.items\.verificationRequiredKyc/,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText("notifications.title")).toBeNull(),
    );
    expect(markRead).not.toHaveBeenCalled();
  });

  it("opens no realtime connection of its own", () => {
    // The sidebar bell is mounted on a phone too (CSS hides it) and holds the
    // one connection; a second would double every refresh.
    render(<NotificationsPopover />);
    expect(useNotificationsRealtime).not.toHaveBeenCalled();
  });
});
