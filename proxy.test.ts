// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

const VISITOR = "203.0.113.50";
const FORGED = "198.51.100.66";

/**
 * The request headers a rewrite forwards, as Next encodes them on the proxy's
 * response: the list of names that replace the originals, and one
 * x-middleware-request-<name> per value.
 */
function forwardedHeaders(response: Response) {
  const names = (response.headers.get("x-middleware-override-headers") ?? "")
    .split(",")
    .filter(Boolean);
  return {
    names,
    get: (name: string) =>
      response.headers.get(`x-middleware-request-${name.toLowerCase()}`),
  };
}

beforeEach(() => {
  vi.stubEnv("VERCEL", "1");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the /api rewrite", () => {
  it("sends the visitor's address to the backend", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/api/users/me", {
        headers: { "x-real-ip": VISITOR },
      }),
    );

    expect(response.headers.get("x-middleware-rewrite")).toContain("/users/me");
    expect(forwardedHeaders(response).get("X-Client-IP")).toBe(VISITOR);
  });

  it("replaces an X-Client-IP the browser sent", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/api/auth/login", {
        method: "POST",
        headers: { "x-real-ip": VISITOR, "X-Client-IP": FORGED },
      }),
    );

    expect(forwardedHeaders(response).get("X-Client-IP")).toBe(VISITOR);
  });

  it("drops an X-Client-IP the browser sent when the address is unknown", async () => {
    vi.stubEnv("VERCEL", "");
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/api/auth/login", {
        method: "POST",
        headers: { "x-real-ip": VISITOR, "X-Client-IP": FORGED },
      }),
    );

    const forwarded = forwardedHeaders(response);
    // The override list is the complete set the backend receives, so a name
    // missing from it is a header removed from the request.
    expect(forwarded.names.length).toBeGreaterThan(0);
    expect(forwarded.names).not.toContain("x-client-ip");
    expect(forwarded.get("X-Client-IP")).toBeNull();
  });
});
