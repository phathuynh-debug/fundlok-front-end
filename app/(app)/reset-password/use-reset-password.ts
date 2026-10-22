"use client";

import { useMutation } from "@tanstack/react-query";
import {
  authenticationService,
  type ResetPasswordPayload,
} from "@/services/authentication.service";
import type { ApiError } from "@/lib/types";

export function useResetPassword() {
  const resetPasswordMutation = useMutation<
    { status: string; message: string },
    ApiError,
    ResetPasswordPayload
  >({
    mutationFn: (payload) => authenticationService.resetPassword(payload),
  });

  return {
    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isPending: resetPasswordMutation.isPending,
    isSuccess: resetPasswordMutation.isSuccess,
    error: resetPasswordMutation.error,
  };
}
