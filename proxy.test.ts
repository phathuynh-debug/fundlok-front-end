// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";
import {
  SESSION_USER_HEADER,
  decodeSessionUser,
  encodeSessionUser,
} from "@/lib/session-user";

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

// The /users/me body the proxy routed on is handed to the page render, so the
// page does not fetch it again (lib/session-user.ts).
describe("the session user hand-off", () => {
  const USER = {
    id: "u-1",
    email: "an@example.com",
    full_name: "Nguyễn Văn An",
    role: "INVESTOR",
    email_verified: true,
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the user the backend returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(Response.json(USER)),
    );
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/dashboard", {
        headers: { cookie: "access_token=opaque-token" },
      }),
    );
    expect(response.headers.get("location")).toBeNull();
    expect(
      decodeSessionUser(forwardedHeaders(response).get(SESSION_USER_HEADER)),
    ).toEqual(USER);
  });

  it("never passes on a copy the browser sent", async () => {
    const forged = encodeSessionUser({ ...USER, role: "SYSTEM_ADMIN" });
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/faq", {
        headers: { [SESSION_USER_HEADER]: forged ?? "" },
      }),
    );
    const forwarded = forwardedHeaders(response);
    expect(forwarded.names).not.toContain(SESSION_USER_HEADER);
    expect(forwarded.get(SESSION_USER_HEADER)).toBeNull();
  });
});

describe("the session user header", () => {
  it("round-trips non-ASCII names", () => {
    const user = {
      id: "u-2",
      email: "b@example.com",
      full_name: "Trần Thị Bích",
    };
    expect(decodeSessionUser(encodeSessionUser(user))).toEqual(user);
  });

  it("skips a user too large for a request header", () => {
    expect(
      encodeSessionUser({ id: "u-3", email_signature: "x".repeat(20_000) }),
    ).toBeNull();
  });

  it("reads garbage as no user", () => {
    expect(decodeSessionUser("not base64 json")).toBeNull();
  });
});

describe("the KYC handoff bypass", () => {
  const signedOut = (path: string) =>
    proxy(new NextRequest(`https://www.fundlok.com${path}?token=t`));

  it("lets the handoff page through without a session", async () => {
    for (const path of ["/kyc/mobile", "/kyc/mobile/"]) {
      const response = await signedOut(path);
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("does not extend to routes that merely share the prefix", async () => {
    for (const path of ["/kyc/mobile-review", "/kyc/mobileX"]) {
      const response = await signedOut(path);
      expect(response.headers.get("location")).toContain("/login");
    }
  });
});
