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
export type NotificationEvent =
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  /** `data.check` is "KYC" (investor) or "KYB" (SME). */
  | "VERIFICATION_REQUIRED"
  /**
   * To the business: an investor uploaded their transfer receipt for an
   * investment in its round. `data` has `amount_vnd`, `memo`, `project` and
   * the masked `investor`.
   */
  | "INVESTMENT_RECEIPT_SUBMITTED"
  /**
   * To the business: staff approved an investor's transfer to its account.
   * `data.status` is ACTIVE (received, repaying from the next working day),
   * CONFIRMED (received) or ATTESTED (older: two working days to dispute);
   * `data` also has `amount_vnd`, `memo`, `project` and the masked `investor`.
   */
  | "INVESTMENT_TRANSFER_APPROVED"
  /**
   * To the business: staff denied the receipt it uploaded for a repayment, so
   * those days are due again. `data` has `tranche_id` (the investment, whose
   * page it pays from), `memo`, the masked `investor`, `amount_vnd` and the
   * note staff gave (`reason`).
   */
  | "REPAYMENT_RECEIPT_REJECTED"
  /**
   * To the investor: the business uploaded the receipt for a repayment to them,
   * so they check their bank account and confirm it arrived. `data` has
   * `tranche_id`, `receipt_id`, `memo`, `project` and `amount_vnd`.
   */
  | "REPAYMENT_RECEIPT_SUBMITTED"
  /**
   * To the business: the investor confirmed a repayment reached them. `data`
   * has `tranche_id`, `memo`, the masked `investor` and `amount_vnd`.
   */
  | "REPAYMENT_RECEIPT_CONFIRMED";

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
