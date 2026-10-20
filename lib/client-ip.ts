/**
 * The visitor's IP address, stated to FastAPI on every Next → FastAPI call.
 *
 * WHY THE FRONTEND SAYS IT
 * The backend never sees a browser. Its caller is this Next server, so the
 * socket peer and the end of X-Forwarded-For over there are Vercel's servers —
 * and the session checks the proxy makes on every page load
 * (services/middleware.service.ts) start on Vercel and carry no visitor address
 * at all. Its audit log and its per-IP rate limit (compliance finding SEC-08)
 * would see every visitor as the same few callers. So every call carries the
 * address in X-Client-IP, and the backend believes it only when the same
 * request carries X-Backend-Secret (FundLok app/utils/client_ip.py).
 *
 * WHERE THE ADDRESS COMES FROM
 * Never from a header the caller wrote. Vercel overwrites x-real-ip with the
 * address that connected to it (the value `ipAddress()` in @vercel/functions
 * reads), so a browser cannot choose it.
 *
 * But fundlok.com is proxied by Cloudflare, so for real visitors that address
 * is a Cloudflare edge; Vercel restores the visitor behind a proxy only on
 * Enterprise. Cloudflare puts the visitor in CF-Connecting-IP, overwriting any
 * copy the visitor sent. That header is believed only when Vercel's own
 * address says the peer IS Cloudflare. Anyone can reach the deployment
 * directly (fundlok-front-end.vercel.app) and type CF-Connecting-IP, and then
 * the peer is them, not Cloudflare.
 *
 * Off Vercel (next dev, next start, CI) x-real-ip is just another header the
 * caller wrote, so nothing is sent and the backend keeps its own rule.
 *
 * SERVER ONLY
 * node:net, and process.env.VERCEL. Callers are proxy.ts and
 * services/middleware.service.ts, as for lib/backend-secret.ts.
 */
import { BlockList, isIP } from "node:net";

/** The header the backend reads. Spelled once, as BACKEND_SECRET_HEADER is. */
export const CLIENT_IP_HEADER = "X-Client-IP";

/**
 * Cloudflare's published edge ranges, https://www.cloudflare.com/ips/ (fetched
 * 2026-10-20). They change rarely. A range missing here fails safe: visitors
 * behind that edge are reported as the edge's address, so they share a rate
 * limit, but a forged address is never believed.
 */
const CLOUDFLARE_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

const cloudflare = new BlockList();
for (const range of CLOUDFLARE_RANGES) {
  const [network, prefix] = range.split("/");
  cloudflare.addSubnet(
    network,
    Number(prefix),
    isIP(network) === 6 ? "ipv6" : "ipv4",
  );
}

/**
 * One address from a header, or null. A repeated header reaches us joined
 * with ", " and fails isIP, which is the point: neither copy is vouched for.
 */
function singleAddress(headers: Headers, name: string): string | null {
  const value = headers.get(name)?.trim();
  return value && isIP(value) ? value : null;
}

/** The visitor's address, or null when it cannot be known for certain. */
export function visitorIp(headers: Headers): string | null {
  if (!process.env.VERCEL) return null;

  const peer = singleAddress(headers, "x-real-ip");
  if (!peer) return null;

  if (cloudflare.check(peer, isIP(peer) === 6 ? "ipv6" : "ipv4")) {
    // Through Cloudflare, the peer is an edge shared by many visitors. Better
    // to say nothing than to name the edge as the visitor.
    return singleAddress(headers, "cf-connecting-ip");
  }
  return peer;
}

/**
 * Headers to merge into a server-side fetch to FastAPI, read from the
 * visitor's request. Empty when the address is unknown, so it is always safe
 * to spread.
 */
export function clientIpHeaders(headers: Headers): Record<string, string> {
  const ip = visitorIp(headers);
  return ip ? { [CLIENT_IP_HEADER]: ip } : {};
}

/**
 * Stamp the address onto a copy of the visitor's own headers, for the /api
 * rewrite that forwards them wholesale.
 *
 * Deletes first, as applyBackendSecret does: whenever the address is unknown,
 * a copy the browser sent would otherwise reach the backend next to a real
 * secret, and be believed.
 */
export function applyClientIp(headers: Headers): Headers {
  const ip = visitorIp(headers);
  headers.delete(CLIENT_IP_HEADER);
  if (ip) headers.set(CLIENT_IP_HEADER, ip);
  return headers;
}
