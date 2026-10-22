import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ActivityFeed } from "./ActivityFeed";
import type { SecurityEvent } from "@/services/authentication.service";

const EVENTS: SecurityEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `event-${i}`,
  action: "SIGN_IN",
  severity: "info",
  ip_address: `192.168.1.${i + 1}`,
  created_at: `2026-08-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

describe("ActivityFeed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders empty state when no events exist", () => {
    render(<ActivityFeed events={[]} />);
    expect(
      screen.getByText("dashboard.security.activity.empty"),
    ).toBeInTheDocument();
  });

  it("limits items to 7 by default when unmanaged and expands on click", async () => {
    render(<ActivityFeed events={EVENTS} />);

    // 7 events rendered initially
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(7);

    const showMoreBtn = screen.getByRole("button", {
      name: "dashboard.security.activity.showMore",
    });
    expect(showMoreBtn).toBeInTheDocument();

    await userEvent.click(showMoreBtn);

    // Expands to all 12
    expect(screen.getAllByRole("listitem")).toHaveLength(12);

    const showLessBtn = screen.getByRole("button", {
      name: "dashboard.security.activity.showLess",
    });
    expect(showLessBtn).toBeInTheDocument();

    await userEvent.click(showLessBtn);
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });

  it("calls onFetchMore and shows loading spinner when server-managed", async () => {
    const onFetchMore = vi.fn();
    const onCollapse = vi.fn();

    const { rerender } = render(
      <ActivityFeed
        events={EVENTS.slice(0, 7)}
        hasMore={true}
        isLoadingMore={false}
        onFetchMore={onFetchMore}
        onCollapse={onCollapse}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(7);

    const showMoreBtn = screen.getByRole("button", {
      name: "dashboard.security.activity.showMore",
    });
    await userEvent.click(showMoreBtn);
    expect(onFetchMore).toHaveBeenCalledOnce();

    // Rerender in loading state
    rerender(
      <ActivityFeed
        events={EVENTS.slice(0, 7)}
        hasMore={true}
        isLoadingMore={true}
        onFetchMore={onFetchMore}
        onCollapse={onCollapse}
      />,
    );

    expect(
      screen.getByText("dashboard.security.activity.loadingMore"),
    ).toBeInTheDocument();
  });
});
