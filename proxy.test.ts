// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";
import { BRAND_ACCENT_HEADER } from "@/lib/appearance";
import { NONCE_HEADER } from "@/lib/csp";
import { LOCALE_HEADER } from "@/lib/locale-routing";
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
      // A page rendered per request: the prerendered marketing pages read no
      // request header at all, so there is nothing there to forge.
      new NextRequest("https://www.fundlok.com/forgot-password", {
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

// The marketing pages are prerendered once per language under app/[lang]/
// (lib/locale-routing.ts MARKETING_PATHS); the public URLs are rewritten to
// those builds and get the fixed CSP, since a built page cannot carry a nonce.
describe("the prerendered marketing pages", () => {
  const rewrittenTo = (response: Response) => {
    const target = response.headers.get("x-middleware-rewrite");
    return target === null ? null : new URL(target).pathname;
  };

  it("serves an unprefixed page from its Vietnamese build", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/rate?for=investor"),
    );
    expect(rewrittenTo(response)).toBe("/vi/rate");
    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "for=investor",
    );
  });

  it("serves the home page from /vi", async () => {
    const response = await proxy(new NextRequest("https://www.fundlok.com/"));
    expect(rewrittenTo(response)).toBe("/vi");
  });

  it("serves an English page at its own URL, which is its build", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/en/faq"),
    );
    expect(response.headers.get("location")).toBeNull();
    expect(rewrittenTo(response)).toBeNull();
  });

  it("gives them the fixed policy, with no nonce", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/contact"),
    );
    const csp = response.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("'unsafe-inline'");
    expect(csp).not.toContain("'nonce-");
    expect(forwardedHeaders(response).get(NONCE_HEADER)).toBeNull();
  });

  it("sends the internal /vi URL to the public one", async () => {
    for (const [from, to] of [
      ["/vi/rate", "/rate"],
      ["/vi", "/"],
    ]) {
      const response = await proxy(
        new NextRequest(`https://www.fundlok.com${from}`),
      );
      expect(response.status).toBe(308);
      expect(new URL(response.headers.get("location")!).pathname).toBe(to);
    }
  });

  it("keeps /login per request, with its nonce and language", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/en/login"),
    );
    expect(rewrittenTo(response)).toBe("/login");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "'nonce-",
    );
    expect(forwardedHeaders(response).get(LOCALE_HEADER)).toBe("en");
  });

  it("keeps the app per request, with its nonce", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/forgot-password"),
    );
    expect(rewrittenTo(response)).toBeNull();
    expect(forwardedHeaders(response).get(NONCE_HEADER)).toBeTruthy();
  });
});

describe("the brand-accent header", () => {
  it("marks the signed-out entry pages, in either language", async () => {
    for (const path of ["/login", "/en/login", "/forgot-password"]) {
      const response = await proxy(
        new NextRequest(`https://www.fundlok.com${path}`),
      );
      expect(forwardedHeaders(response).get(BRAND_ACCENT_HEADER), path).toBe(
        "1",
      );
    }
  });

  it("drops one the browser sent on any other page", async () => {
    const response = await proxy(
      new NextRequest("https://www.fundlok.com/no-such-page", {
        headers: { [BRAND_ACCENT_HEADER]: "1" },
      }),
    );
    const forwarded = forwardedHeaders(response);
    expect(forwarded.names).not.toContain(BRAND_ACCENT_HEADER);
    expect(forwarded.get(BRAND_ACCENT_HEADER)).toBeNull();
  });
});
