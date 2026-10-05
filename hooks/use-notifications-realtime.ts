"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PartySocket } from "partysocket";
import { notificationsService } from "@/services/notifications.service";
import { notificationKeys } from "@/hooks/use-notifications";

/**
 * Live nudge for the bell.
 *
 * PartyKit only says "something changed"; the list still comes from the
 * cookie-authenticated API, so this adds latency-free refreshes without a
 * second data path. Polling (`useNotifications` staleTime) is untouched and is
 * the whole behaviour whenever this is off, unconfigured, or disconnected.
 *
 * The connection is not React Query state: it is a live handle with a
 * lifecycle, owned by this effect.
 */
export function useNotificationsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

  useEffect(() => {
    if (!host || !userId) return;

    const socket = new PartySocket({
      host,
      // The room is the user's own id; the server rejects any other token.
      room: userId,
      // Re-run on every (re)connect: the token lives ~60s, so a reused one
      // would fail the first reconnect after a drop.
      query: async () => {
        try {
          const { token } = await notificationsService.realtimeToken();
          return { token };
        } catch {
          // Realtime off (404) or signed out: connect without a token, get
          // refused, and let the library back off. Polling covers the gap.
          return {};
        }
      },
    });

    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg?.type === "notifications.changed") {
          queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        }
      } catch {
        // Not ours; ignore.
      }
    });
    // A reconnect may have missed a push while we were away.
    socket.addEventListener("open", () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    return () => socket.close();
  }, [host, userId, queryClient]);
}
