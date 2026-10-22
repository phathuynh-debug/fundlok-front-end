import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SessionList } from "./SessionList";
import type { DeviceSession } from "@/services/authentication.service";

// Two live sign-ins as /auth/sessions returns them: the caller's own device
// and one other.
const SESSIONS: DeviceSession[] = [
  {
    session_id: "sess-current",
    device: "Mac",
    browser: "Chrome 141",
    ip_address: "113.161.44.18",
    created_at: "2026-08-18T08:42:00Z",
    last_used_at: "2026-08-18T08:42:00Z",
    current: true,
  },
  {
    session_id: "sess-other",
    device: "iPhone",
    browser: "Safari 17",
    ip_address: "27.75.219.4",
    created_at: "2026-08-17T21:05:00Z",
    last_used_at: "2026-08-17T21:05:00Z",
    current: false,
  },
];

// Echo translation keys so assertions read against stable identifiers rather
// than copy that may be reworded.
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

function setup(sessions = SESSIONS) {
  const onRevoke = vi.fn();
  const onRevokeAll = vi.fn();
  render(
    <SessionList
      sessions={sessions}
      onRevoke={onRevoke}
      onRevokeAll={onRevokeAll}
    />,
  );
  return { onRevoke, onRevokeAll };
}

describe("SessionList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cannot sign out the device you are browsing from", () => {
    setup();
    const current = screen.getByRole("button", {
      name: "dashboard.security.sessions.currentAction",
    });
    expect(current).toBeDisabled();
  });

  it("revokes the session that was clicked", async () => {
    const { onRevoke } = setup();
    const buttons = screen.getAllByRole("button", {
      name: "dashboard.security.sessions.revoke",
    });
    // one of the two sessions is revocable — never the current one
    expect(buttons).toHaveLength(1);

    await userEvent.click(buttons[0]);
    expect(onRevoke).toHaveBeenCalledExactlyOnceWith("sess-other");
  });

  it("disables sign-out-everywhere when only this device is left", () => {
    const { onRevokeAll } = setup(SESSIONS.filter((s) => s.current));
    expect(
      screen.getByRole("button", {
        name: "dashboard.security.sessions.revokeAll",
      }),
    ).toBeDisabled();
    expect(
      screen.getByText("dashboard.security.sessions.onlyThisDevice"),
    ).toBeInTheDocument();
    expect(onRevokeAll).not.toHaveBeenCalled();
  });

  it("limits sessions to 7 initially and extends when clicking show more", async () => {
    const manySessions: DeviceSession[] = Array.from(
      { length: 10 },
      (_, i) => ({
        session_id: `sess-${i}`,
        device: `Device ${i}`,
        browser: "Chrome",
        ip_address: "127.0.0.1",
        created_at: "2026-08-18T08:42:00Z",
        last_used_at: "2026-08-18T08:42:00Z",
        current: i === 0,
      }),
    );

    setup(manySessions);

    // Only 7 items should be visible initially
    expect(screen.getByText("Device 0 · Chrome")).toBeInTheDocument();
    expect(screen.getByText("Device 6 · Chrome")).toBeInTheDocument();
    expect(screen.queryByText("Device 7 · Chrome")).not.toBeInTheDocument();

    const showMoreBtn = screen.getByRole("button", {
      name: "dashboard.security.sessions.showMore",
    });
    expect(showMoreBtn).toBeInTheDocument();

    // Click show more
    await userEvent.click(showMoreBtn);

    // All 10 items should now be visible
    expect(screen.getByText("Device 7 · Chrome")).toBeInTheDocument();
    expect(screen.getByText("Device 9 · Chrome")).toBeInTheDocument();

    // Collapse button should now be visible
    const showLessBtn = screen.getByRole("button", {
      name: "dashboard.security.sessions.showLess",
    });
    expect(showLessBtn).toBeInTheDocument();

    // Click collapse
    await userEvent.click(showLessBtn);
    await waitFor(() => {
      expect(screen.queryByText("Device 7 · Chrome")).not.toBeInTheDocument();
    });
  });
});
