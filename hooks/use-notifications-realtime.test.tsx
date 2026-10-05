import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useNotificationsRealtime } from "./use-notifications-realtime";
import { notificationKeys } from "./use-notifications";

type Listener = (e: { data?: string }) => void;
const sockets: {
  opts: Record<string, unknown>;
  listeners: Record<string, Listener>;
  close: ReturnType<typeof vi.fn>;
}[] = [];

vi.mock("partysocket", () => ({
  PartySocket: class {
    listeners: Record<string, Listener> = {};
    close = vi.fn();
    constructor(public opts: Record<string, unknown>) {
      sockets.push(this);
    }
    addEventListener(name: string, fn: Listener) {
      this.listeners[name] = fn;
    }
  },
}));

function setup() {
  const client = new QueryClient();
  const spy = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { spy, wrapper };
}

describe("useNotificationsRealtime", () => {
  beforeEach(() => {
    sockets.length = 0;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not connect without a host", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTYKIT_HOST", "");
    const { wrapper } = setup();
    renderHook(() => useNotificationsRealtime("u1"), { wrapper });
    expect(sockets).toHaveLength(0);
  });

  it("does not connect for a signed-out user", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTYKIT_HOST", "x.partykit.dev");
    const { wrapper } = setup();
    renderHook(() => useNotificationsRealtime(undefined), { wrapper });
    expect(sockets).toHaveLength(0);
  });

  it("joins the user's own room and invalidates on a push", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTYKIT_HOST", "x.partykit.dev");
    const { wrapper, spy } = setup();
    renderHook(() => useNotificationsRealtime("u1"), { wrapper });
    expect(sockets[0].opts.room).toBe("u1");

    sockets[0].listeners.message({
      data: JSON.stringify({ type: "notifications.changed" }),
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: notificationKeys.all });
  });

  it("ignores unrelated messages and closes on unmount", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTYKIT_HOST", "x.partykit.dev");
    const { wrapper, spy } = setup();
    const { unmount } = renderHook(() => useNotificationsRealtime("u1"), {
      wrapper,
    });
    sockets[0].listeners.message({ data: "garbage" });
    expect(spy).not.toHaveBeenCalled();
    unmount();
    expect(sockets[0].close).toHaveBeenCalled();
  });
});
