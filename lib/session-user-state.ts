import { dehydrate, type DehydratedState } from "@tanstack/react-query";
import { authKeys } from "@/hooks/auth-keys";
import { makeQueryClient } from "@/lib/query-client";
import type { User } from "@/services/authentication.service";

// Kept apart from lib/session-user.ts so proxy.ts, which only encodes the
// header, does not pull React Query into its bundle.

/** React Query state holding just the current user, for HydrationBoundary. */
export function sessionUserState(user: User): DehydratedState {
  const queryClient = makeQueryClient();
  queryClient.setQueryData(authKeys.currentUser(), user);
  return dehydrate(queryClient);
}
