import { routePartykitRequest, Server } from "partyserver";
import { jwtVerify } from "jose";

// One room per user (room id = user id). The room never carries notification
// content: it only tells that user's open tabs "refetch". The browser then
// asks the cookie-authenticated API for the real data.
//
// Secrets (set with `wrangler secret put`, must match the FastAPI backend):
//   PARTYKIT_JWT_SECRET      verifies the short token the backend mints
//   PARTYKIT_PUBLISH_SECRET  authorises the backend to publish

const TOKEN_AUDIENCE = "partykit";

export interface Env {
  // The binding name decides the URL: "Main" -> /parties/main/<room>.
  Main: DurableObjectNamespace;
  PARTYKIT_JWT_SECRET?: string;
  PARTYKIT_PUBLISH_SECRET?: string;
}

export class Main extends Server<Env> {
  // Sockets sleep between pushes instead of billing for idle time.
  static options = { hibernate: true };

  // The backend's publish call: POST /parties/main/<user_id>.
  async onRequest(req: Request) {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const secret = this.env.PARTYKIT_PUBLISH_SECRET;
    if (!secret || req.headers.get("Authorization") !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    // Fixed payload: whatever the caller posted is ignored on purpose. The body
    // is still drained so the runtime does not complain about an unread stream.
    await req.text();
    this.broadcast(JSON.stringify({ type: "notifications.changed" }));
    return new Response("ok");
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const routed = await routePartykitRequest(request, env, {
      // Runs before a socket is accepted: a missing, expired, or other-user
      // token never gets a connection.
      onBeforeConnect: async (req, { name }) => {
        const token = new URL(req.url).searchParams.get("token");
        const secret = env.PARTYKIT_JWT_SECRET;
        if (!token || !secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(secret),
            { audience: TOKEN_AUDIENCE, algorithms: ["HS256"] },
          );
          if (payload.sub !== name) {
            return new Response("Forbidden", { status: 403 });
          }
        } catch {
          return new Response("Unauthorized", { status: 401 });
        }
      },
    });
    return routed ?? new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
