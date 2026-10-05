"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PartySocket } from "partysocket";
import { notificationsService } from "@/services/notifications.service";
import { notificationKeys } from "@/hooks/use-notifications";
import { projectKeys } from "@/hooks/use-projects";

/**
 * Live nudge for the bell.
 *
 * PartyKit only says "something changed"; the list still comes from the
 * cookie-authenticated API, so this adds latency-free refreshes without a
 * second data path. Polling (`useNotifications` staleTime) is untouched and is
 * the whole behaviour whenever this is off, unconfigured, or disconnected.
 *
 * A push also refreshes the user's projects. The SME dashboard draws the
 * application tracker, the approval summary and the project's status from
 * `useMyProjects` (cached for two minutes), and the push exists because that
 * data just changed -- an admin decision is the case it was built for. Without
 * this the bell would light up while the page beside it still said "under
 * review" until the next reload.
 *
 * The connection is not React Query state: it is a live handle with a
 * lifecycle, owned by this effect.
 */
export function useNotificationsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

  useEffect(() => {
    if (!host || !userId) return;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    };

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
          refresh();
        }
      } catch {
        // Not ours; ignore.
      }
    });
    // A reconnect may have missed a push while we were away.
    socket.addEventListener("open", refresh);

    return () => socket.close();
  }, [host, userId, queryClient]);
}
