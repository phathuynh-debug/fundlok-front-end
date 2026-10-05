import { apiClient } from "@/lib/api-client";
import { NOTIFICATION_ENDPOINTS } from "@/lib/endpoints";

/**
 * The events the backend can send (app/notifications/models.py).
 *
 * A union rather than `string` so a new backend event cannot silently render
 * as a blank row: adding one here is what forces the copy and the icon to be
 * added with it. Unknown values are still handled at the render site, because
 * a deployed backend can be ahead of a cached client.
 */
export type NotificationEvent = "APPLICATION_APPROVED" | "APPLICATION_REJECTED";

export interface AppNotification {
  id: string;
  event: NotificationEvent;
  entity_type: string | null;
  entity_id: string | null;
  /** Placeholders for the copy — the backend stores no rendered text. */
  data: Record<string, unknown>;
  /** Null = unread. */
  read_at: string | null;
  created_at: string | null;
}

export interface NotificationList {
  items: AppNotification[];
  /** Counted over every notification, not just the page returned. */
  unread: number;
}

export interface RealtimeToken {
  token: string;
  /** Seconds. Short on purpose: it only has to survive the handshake. */
  expires_in: number;
}

export const notificationsService = {
  list(limit?: number) {
    return apiClient.get<NotificationList>(NOTIFICATION_ENDPOINTS.list, {
      params: limit ? { limit } : undefined,
    });
  },

  markRead(id: string) {
    return apiClient.patch<AppNotification>(
      NOTIFICATION_ENDPOINTS.markRead(id),
    );
  },

  markAllRead() {
    return apiClient.post<{ updated: number }>(
      NOTIFICATION_ENDPOINTS.markAllRead,
    );
  },

  /** 404 when the backend has realtime switched off — callers stay on polling. */
  realtimeToken() {
    return apiClient.post<RealtimeToken>(NOTIFICATION_ENDPOINTS.realtimeToken);
  },
};
