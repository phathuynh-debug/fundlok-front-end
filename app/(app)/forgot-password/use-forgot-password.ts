"use client";

import { useMutation } from "@tanstack/react-query";
import {
  authenticationService,
  type ForgotPasswordPayload,
} from "@/services/authentication.service";
import type { ApiError } from "@/lib/types";

export function useForgotPassword() {
  const forgotPasswordMutation = useMutation<
    { status: string; message: string },
    ApiError,
    ForgotPasswordPayload
  >({
    mutationFn: (payload) => authenticationService.forgotPassword(payload),
  });

  return {
    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
    isPending: forgotPasswordMutation.isPending,
    isSuccess: forgotPasswordMutation.isSuccess,
    error: forgotPasswordMutation.error,
  };
}
