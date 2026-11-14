import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useSecurityEvents } from "./use-authentication";

// Each page is answered on demand, so the test can look at the hook while the
// bigger page is still on its way.
const pending = vi.hoisted(
  () => [] as { limit?: number; resolve: (events: unknown[]) => void }[],
);

vi.mock("@/services/authentication.service", () => ({
  authenticationService: {
    listSecurityEvents: (limit?: number) =>
      new Promise((resolve) => pending.push({ limit, resolve })),
  },
  isTotpChallenge: () => false,
}));

const events = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `ev-${i}`,
    action: "SIGN_IN",
    severity: "info",
  }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSecurityEvents", () => {
  it("keeps the events already shown while a bigger page loads", async () => {
    const { result, rerender } = renderHook(
      ({ limit }) => useSecurityEvents(true, limit),
      { wrapper, initialProps: { limit: 7 } },
    );
    pending.shift()!.resolve(events(7));
    await waitFor(() => expect(result.current.data).toHaveLength(7));

    // "Show more": a new limit is a new query.
    rerender({ limit: 14 });
    await waitFor(() => expect(pending).toHaveLength(1));

    // Not a first load: the page keeps its content, the seven stay shown.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.data).toHaveLength(7);

    pending.shift()!.resolve(events(14));
    await waitFor(() => expect(result.current.data).toHaveLength(14));
    expect(result.current.isPlaceholderData).toBe(false);
  });
});
