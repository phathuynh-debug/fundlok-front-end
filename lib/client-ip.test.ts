// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLIENT_IP_HEADER,
  applyClientIp,
  clientIpHeaders,
  visitorIp,
} from "./client-ip";

const VISITOR = "203.0.113.50";
const FORGED = "198.51.100.66";
// Inside Cloudflare's 172.64.0.0/13 and 2a06:98c0::/29.
const CLOUDFLARE_EDGE = "172.70.1.2";
const CLOUDFLARE_EDGE_V6 = "2a06:98c1:3120::3";

beforeEach(() => {
  vi.stubEnv("VERCEL", "1");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("visitorIp", () => {
  it("is Vercel's own address for a visitor who reached it directly", () => {
    expect(visitorIp(new Headers({ "x-real-ip": VISITOR }))).toBe(VISITOR);
  });

  it("ignores CF-Connecting-IP from a caller that is not Cloudflare", () => {
    // Someone calling fundlok-front-end.vercel.app directly can type the
    // header; Vercel's peer address shows they are not Cloudflare.
    const headers = new Headers({
      "x-real-ip": VISITOR,
      "cf-connecting-ip": FORGED,
    });
    expect(visitorIp(headers)).toBe(VISITOR);
  });

  it.each([CLOUDFLARE_EDGE, CLOUDFLARE_EDGE_V6])(
    "takes CF-Connecting-IP when the peer is a Cloudflare edge (%s)",
    (edge) => {
      const headers = new Headers({
        "x-real-ip": edge,
        "cf-connecting-ip": VISITOR,
      });
      expect(visitorIp(headers)).toBe(VISITOR);
    },
  );

  it("names nobody when Cloudflare is the peer but names no visitor", () => {
    // The edge is shared by many visitors; naming it would put them all under
    // one rate limit.
    expect(visitorIp(new Headers({ "x-real-ip": CLOUDFLARE_EDGE }))).toBeNull();
    expect(
      visitorIp(
        new Headers({ "x-real-ip": CLOUDFLARE_EDGE, "cf-connecting-ip": "x" }),
      ),
    ).toBeNull();
  });

  it("accepts exactly one address and nothing else", () => {
    for (const value of ["", "not-an-ip", `${FORGED}, ${VISITOR}`]) {
      expect(visitorIp(new Headers({ "x-real-ip": value }))).toBeNull();
    }
    const repeated = new Headers();
    repeated.append("x-real-ip", FORGED);
    repeated.append("x-real-ip", VISITOR);
    expect(visitorIp(repeated)).toBeNull();
  });

  it("sends nothing off Vercel, where x-real-ip is whatever the caller typed", () => {
    vi.stubEnv("VERCEL", "");
    expect(visitorIp(new Headers({ "x-real-ip": FORGED }))).toBeNull();
  });
});

describe("applyClientIp", () => {
  it("sets the visitor's address", () => {
    const headers = applyClientIp(new Headers({ "x-real-ip": VISITOR }));
    expect(headers.get(CLIENT_IP_HEADER)).toBe(VISITOR);
  });

  it("replaces a copy the browser sent", () => {
    const headers = applyClientIp(
      new Headers({ "x-real-ip": VISITOR, [CLIENT_IP_HEADER]: FORGED }),
    );
    expect(headers.get(CLIENT_IP_HEADER)).toBe(VISITOR);
  });

  it("strips a copy the browser sent even when the address is unknown", () => {
    // Without the delete, this is exactly the case where the browser's value
    // would reach the backend next to a real secret.
    vi.stubEnv("VERCEL", "");
    const headers = applyClientIp(
      new Headers({ "x-real-ip": VISITOR, "x-client-ip": FORGED }),
    );
    expect(headers.has(CLIENT_IP_HEADER)).toBe(false);
  });
});

describe("clientIpHeaders", () => {
  it("is spreadable whether or not the address is known", () => {
    expect(clientIpHeaders(new Headers({ "x-real-ip": VISITOR }))).toEqual({
      [CLIENT_IP_HEADER]: VISITOR,
    });
    expect(clientIpHeaders(new Headers())).toEqual({});
  });

  it("never echoes the browser's own copy", () => {
    expect(
      clientIpHeaders(
        new Headers({ "x-real-ip": VISITOR, [CLIENT_IP_HEADER]: FORGED }),
      ),
    ).toEqual({ [CLIENT_IP_HEADER]: VISITOR });
  });
});
