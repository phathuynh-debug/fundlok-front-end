"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  usersService,
  type SetPasswordRequest,
  type SetPasswordResponse,
  type UpdateProfileRequest,
} from "@/services/users.service";
import { authKeys } from "@/hooks/use-authentication";
import type { User } from "@/services/authentication.service";
import type { ApiError } from "@/lib/types";

export interface UpdateAvatarVariables {
  file: File;
  onProgress?: (percent: number) => void;
}

// presign → PUT to R2 → confirm. The confirm response is the refreshed user,
// so seed it into the currentUser cache — every component reading
// useCurrentUser (header, sidebar, profile) reflects the new avatar at once.
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateAvatarVariables>({
    mutationFn: ({ file, onProgress }) =>
      usersService.uploadAvatar({ file, onProgress }),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
    },
  });
}

// PATCH /users/me. The response is the refreshed user, so seed it into the
// currentUser cache — header, sidebar, and profile reflect the edit at once.
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateProfileRequest>({
    mutationFn: (payload) => usersService.updateProfile(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
    },
  });
}

// POST /users/me/password. The response is an ack rather than a user, so
// there's nothing to seed — but the account has just gained a password, so
// invalidate currentUser to pick up has_password and swap the profile card
// over to the forgot-password route.
export function useSetPassword() {
  const queryClient = useQueryClient();

  return useMutation<SetPasswordResponse, ApiError, SetPasswordRequest>({
    mutationFn: (payload) => usersService.setPassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}
