"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import { useCurrentUser } from "@/hooks/use-authentication";
import {
  adminEmailService,
  type EmailContentPayload,
  type EmailPolicy,
  type EmailPreview,
  type EmailRecipient,
  type EmailSettings,
  type EmailSettingsPayload,
  type EmailTestResult,
  type InternalEmail,
  type SendEmailPayload,
} from "@/services/admin-email.service";

// Settings and the send log belong to the signed-in admin (a system admin's
// log is everyone's), so their keys carry the admin's id: another admin
// signing in on the same tab is never served the previous one's cache. The
// policy is org-wide and shared.
export const adminEmailKeys = {
  all: ["admin-email"] as const,
  forUser: (userId: string) => [...adminEmailKeys.all, "user", userId] as const,
  settings: (userId: string) =>
    [...adminEmailKeys.forUser(userId), "settings"] as const,
  messages: (userId: string) =>
    [...adminEmailKeys.forUser(userId), "messages"] as const,
  policy: () => [...adminEmailKeys.all, "policy"] as const,
  // The user directory is the same for every admin.
  recipients: (q: string, fundlokOnly: boolean) =>
    [...adminEmailKeys.all, "recipients", q, fundlokOnly] as const,
};

/** The signed-in admin's id; the per-admin queries wait for it. */
function useAdminId(): string | undefined {
  return useCurrentUser().data?.id;
}

export function useEmailSettings(enabled = true) {
  const userId = useAdminId();
  return useQuery<EmailSettings, ApiError>({
    queryKey: adminEmailKeys.settings(userId ?? ""),
    queryFn: () => adminEmailService.getSettings(),
    staleTime: 0,
    retry: false,
    enabled: enabled && !!userId,
  });
}

export function useSaveEmailSettings() {
  const queryClient = useQueryClient();
  const userId = useAdminId();
  return useMutation<EmailSettings, ApiError, EmailSettingsPayload>({
    mutationFn: (payload) => adminEmailService.saveSettings(payload),
    onSuccess: (settings) => {
      if (userId)
        queryClient.setQueryData(adminEmailKeys.settings(userId), settings);
    },
  });
}

export function useClearEmailSettings() {
  const queryClient = useQueryClient();
  const userId = useAdminId();
  return useMutation<EmailSettings, ApiError, void>({
    mutationFn: () => adminEmailService.clearSettings(),
    onSuccess: (settings) => {
      if (userId)
        queryClient.setQueryData(adminEmailKeys.settings(userId), settings);
    },
  });
}

export function useEmailPolicy(enabled = true) {
  return useQuery<EmailPolicy, ApiError>({
    queryKey: adminEmailKeys.policy(),
    queryFn: () => adminEmailService.getPolicy(),
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  });
}

// SYSTEM_ADMIN only.
export function useSaveEmailPolicy() {
  const queryClient = useQueryClient();
  return useMutation<EmailPolicy, ApiError, string[]>({
    mutationFn: (domains) => adminEmailService.savePolicy(domains),
    onSuccess: (policy) => {
      queryClient.setQueryData(adminEmailKeys.policy(), policy);
    },
  });
}

// Success stamps last_verified_at; either way a log row was written.
export function useSendTestEmail() {
  const queryClient = useQueryClient();
  const userId = useAdminId();
  return useMutation<EmailTestResult, ApiError, void>({
    mutationFn: () => adminEmailService.sendTestEmail(),
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: adminEmailKeys.forUser(userId),
        });
      }
    },
  });
}

export function usePreviewEmail() {
  return useMutation<EmailPreview, ApiError, EmailContentPayload>({
    mutationFn: (payload) => adminEmailService.preview(payload),
  });
}

// A failed send is logged too, so the list refreshes on either outcome.
export function useSendEmail() {
  const queryClient = useQueryClient();
  const userId = useAdminId();
  return useMutation<InternalEmail, ApiError, SendEmailPayload>({
    mutationFn: (payload) => adminEmailService.send(payload),
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: adminEmailKeys.messages(userId),
        });
      }
    },
  });
}

export function useSentEmails(enabled = true) {
  const userId = useAdminId();
  return useQuery<InternalEmail[], ApiError>({
    queryKey: adminEmailKeys.messages(userId ?? ""),
    queryFn: () => adminEmailService.listMessages(20),
    staleTime: 30 * 1000,
    retry: false,
    enabled: enabled && !!userId,
  });
}

export function useEmailRecipients(
  q: string,
  fundlokOnly: boolean,
  enabled = true,
) {
  return useQuery<EmailRecipient[], ApiError>({
    queryKey: adminEmailKeys.recipients(q.trim(), fundlokOnly),
    queryFn: () => adminEmailService.listRecipients({ q, fundlokOnly }),
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  });
}

/** For a one-off action (the "add all FundLok emails" button): loads the
 * FundLok addresses, from the cache when fresh. */
export function useLoadFundlokRecipients() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.fetchQuery<EmailRecipient[], ApiError>({
      queryKey: adminEmailKeys.recipients("", true),
      queryFn: () => adminEmailService.listRecipients({ fundlokOnly: true }),
      staleTime: 60 * 1000,
    });
}
