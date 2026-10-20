// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { middlewareService } from "./middleware.service";

const VISITOR = "203.0.113.50";
const FORGED = "198.51.100.66";

const fetchMock = vi.fn<typeof fetch>();

/** The headers the backend was sent on the one call this test made. */
function sentHeaders(): Headers {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return new Headers(fetchMock.mock.calls[0][1]?.headers);
}

/** A page load by a signed-in visitor who also tried to name their own IP. */
function pageLoad() {
  return new NextRequest("https://www.fundlok.com/dashboard", {
    headers: {
      // Not a JWT, so the expiry pre-check passes it on to the backend.
      cookie: "access_token=opaque-token; refresh_token=opaque-refresh",
      "x-real-ip": VISITOR,
      "X-Client-IP": FORGED,
    },
  });
}

beforeEach(() => {
  vi.stubEnv("VERCEL", "1");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// These calls start on the Next server, not in the browser, so nothing of the
// visitor reaches the backend unless it is put there. Each must carry the
// visitor's address, never the one the browser sent.
describe("server-side calls to the backend", () => {
  it("the session lookup", async () => {
    fetchMock.mockResolvedValue(Response.json({ role: "SME" }));
    await middlewareService.getCurrentUser(pageLoad());
    expect(sentHeaders().get("X-Client-IP")).toBe(VISITOR);
  });

  it("the session refresh", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await middlewareService.refreshSession(pageLoad());
    expect(sentHeaders().get("X-Client-IP")).toBe(VISITOR);
  });

  it("the verification status lookup", async () => {
    fetchMock.mockResolvedValue(Response.json({ is_approved: true }));
    await middlewareService.getVerificationApproved(pageLoad(), "INVESTOR");
    expect(sentHeaders().get("X-Client-IP")).toBe(VISITOR);
  });

  it("the maintenance flag", async () => {
    fetchMock.mockResolvedValue(Response.json({ enabled: false }));
    await middlewareService.getMaintenance(pageLoad());
    expect(sentHeaders().get("X-Client-IP")).toBe(VISITOR);
  });

  it("send nothing, and not the browser's copy, when the address is unknown", async () => {
    vi.stubEnv("VERCEL", "");
    fetchMock.mockResolvedValue(Response.json({ role: "SME" }));
    await middlewareService.getCurrentUser(pageLoad());
    expect(sentHeaders().has("X-Client-IP")).toBe(false);
  });
});
