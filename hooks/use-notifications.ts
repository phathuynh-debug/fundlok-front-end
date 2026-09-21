"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  notificationsService,
  type AppNotification,
  type NotificationList,
} from "@/services/notifications.service";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (limit?: number) => [...notificationKeys.all, "list", limit] as const,
};

/**
 * The bell's list.
 *
 * `enabled` is the caller's: the bell renders inside authenticated layouts,
 * but the sidebar mounts before `useCurrentUser` has resolved, and firing this
 * for a signed-out visitor would answer 401 and light up the error path for a
 * question nobody asked.
 */
export function useNotifications(enabled = true, limit?: number) {
  return useQuery<NotificationList, ApiError>({
    queryKey: notificationKeys.list(limit),
    queryFn: () => notificationsService.list(limit),
    // A notification is not urgent enough to refetch constantly, and Phase 2
    // replaces the waiting with a push. Until then a minute is the worst-case
    // lag on an already-open tab.
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<AppNotification, ApiError, string>({
    mutationFn: (id) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<{ updated: number }, ApiError, void>({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
