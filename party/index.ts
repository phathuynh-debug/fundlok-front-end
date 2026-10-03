import type * as Party from "partykit/server";
import { jwtVerify } from "jose";

// One room per user (room id = user id). The room never carries notification
// content: it only tells that user's open tabs "refetch". The browser then
// asks the cookie-authenticated API for the real data.
//
// Secrets (set with `partykit env add`, must match the FastAPI backend):
//   PARTYKIT_JWT_SECRET      verifies the short token the backend mints
//   PARTYKIT_PUBLISH_SECRET  authorises the backend to publish

const TOKEN_AUDIENCE = "partykit";

export default class NotificationsServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Runs before the socket is accepted: a missing, expired, or other-user
  // token never gets a connection.
  static async onBeforeConnect(req: Party.Request, lobby: Party.Lobby) {
    const token = new URL(req.url).searchParams.get("token");
    const secret = lobby.env.PARTYKIT_JWT_SECRET;
    if (!token || typeof secret !== "string") {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        { audience: TOKEN_AUDIENCE, algorithms: ["HS256"] },
      );
      if (payload.sub !== lobby.id) {
        return new Response("Forbidden", { status: 403 });
      }
      return req;
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  // The backend's publish call: POST /parties/main/<user_id>.
  async onRequest(req: Party.Request) {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const secret = this.room.env.PARTYKIT_PUBLISH_SECRET;
    if (
      typeof secret !== "string" ||
      req.headers.get("Authorization") !== `Bearer ${secret}`
    ) {
      return new Response("Unauthorized", { status: 401 });
    }
    // Fixed payload: whatever the caller posted is ignored on purpose. The body
    // is still drained, or the runtime logs "Can't read from request stream
    // after response has been sent".
    await req.text();
    this.room.broadcast(JSON.stringify({ type: "notifications.changed" }));
    return new Response("ok");
  }
}

NotificationsServer satisfies Party.Worker;
