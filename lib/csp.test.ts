import { afterEach, describe, expect, it, vi } from "vitest";

import { contentSecurityPolicy, createNonce } from "./csp";

/** The sources listed for one directive, e.g. directive(csp, "script-src"). */
function directive(csp: string, name: string): string[] {
  const found = csp
    .split(";")
    .map((d) => d.trim().split(/\s+/))
    .find(([n]) => n === name);
  if (!found) throw new Error(`no ${name} in: ${csp}`);
  return found.slice(1);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createNonce", () => {
  it("matches the pattern Next extracts nonces with", () => {
    // next/dist/server/app-render/get-script-nonce-from-header — a nonce that
    // fails this is silently dropped and every script on the page is blocked.
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/_-]+={0,2}$/);
  });

  it("is different on every call", () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
  });
});

describe("contentSecurityPolicy", () => {
  it("allows scripts by nonce only, never inline or eval, in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const scripts = directive(contentSecurityPolicy("abc123"), "script-src");
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it("allows eval in development, where React needs it for error stacks", () => {
    vi.stubEnv("NODE_ENV", "development");
    const scripts = directive(contentSecurityPolicy("abc123"), "script-src");
    expect(scripts).toContain("'unsafe-eval'");
  });

  it("keeps the nonce out of style-src, where it would disable 'unsafe-inline'", () => {
    const styles = directive(contentSecurityPolicy("abc123"), "style-src");
    expect(styles).toContain("'unsafe-inline'");
    expect(styles.some((s) => s.startsWith("'nonce-"))).toBe(false);
  });

  it("blocks plugins, <base> rewrites and framing", () => {
    const csp = contentSecurityPolicy("abc123");
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'none'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
  });

  it("never allows a bare wildcard source", () => {
    const sources = contentSecurityPolicy("abc123")
      .split(";")
      .flatMap((d) => d.trim().split(/\s+/).slice(1));
    expect(sources).not.toContain("*");
    expect(sources).not.toContain("https:");
  });

  it("lets uploads and previews reach R2", () => {
    const csp = contentSecurityPolicy("abc123");
    for (const name of ["connect-src", "img-src", "frame-src"]) {
      expect(directive(csp, name)).toContain(
        "https://*.r2.cloudflarestorage.com",
      );
    }
  });

  it("opens a secure websocket to a deployed realtime relay", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTYKIT_HOST", "realtime.fundlok.com");
    expect(directive(contentSecurityPolicy("n"), "connect-src")).toContain(
      "wss://realtime.fundlok.com",
    );
  });

  it("uses plain ws:// for a local relay, as partysocket does", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTYKIT_HOST", "localhost:1999");
    expect(directive(contentSecurityPolicy("n"), "connect-src")).toContain(
      "ws://localhost:1999",
    );
  });

  it("adds no websocket origin when realtime is off", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTYKIT_HOST", "");
    const connect = directive(contentSecurityPolicy("n"), "connect-src");
    expect(connect.some((s) => s.startsWith("ws"))).toBe(false);
  });
});
