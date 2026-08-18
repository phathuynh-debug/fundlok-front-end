import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SessionList } from "./SessionList";
import { MOCK_SESSIONS } from "./mock-security";

// Echo translation keys so assertions read against stable identifiers rather
// than copy that may be reworded.
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

function setup(sessions = MOCK_SESSIONS) {
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
    // two of the three sample sessions are revocable
    expect(buttons).toHaveLength(2);

    await userEvent.click(buttons[0]);
    expect(onRevoke).toHaveBeenCalledExactlyOnceWith("sess-2");
  });

  it("disables sign-out-everywhere when only this device is left", () => {
    const { onRevokeAll } = setup(MOCK_SESSIONS.filter((s) => s.current));
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

  it("flags a session from an unrecognized device", () => {
    setup();
    expect(
      screen.getByText("dashboard.security.sessions.unrecognized"),
    ).toBeInTheDocument();
  });
});
