"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import {
	authenticationService,
	type LoginPayload,
	type OAuthLoginPayload,
	type OAuthTokenResponse,
	type User,
} from "@/services/authentication.service";
import { authKeys } from "@/hooks/use-authentication";
import type { ApiError } from "@/lib/types";

export function useLogin() {
	const queryClient = useQueryClient();
	const router = useRouter();

	const emailPasswordLogin = useMutation<User, ApiError, LoginPayload>({
		mutationFn: (payload) => authenticationService.login(payload),
		onSuccess: (user) => {
			queryClient.setQueryData(authKeys.currentUser(), user);
			router.push("/dashboard");
		},
	});

	const googleLogin = useMutation<
		OAuthTokenResponse,
		ApiError,
		OAuthLoginPayload
	>({
		mutationFn: (payload) => authenticationService.oauthLogin(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
			router.push("/dashboard");
		},
	});

	const handleGoogleLogin = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			const anyResp = tokenResponse as any;
			const idToken =
				anyResp?.credential ?? anyResp?.id_token ?? anyResp?.access_token;

			if (!idToken) {
				return;
			}

			googleLogin.mutate({ provider: "google", id_token: idToken });
		},
		onError: () => {
			// Let the UI surface the error state through the Google button.
		},
	});

	return {
		login: emailPasswordLogin.mutate,
		loginAsync: emailPasswordLogin.mutateAsync,
		googleLogin: handleGoogleLogin,
		googleLoginAsync: googleLogin.mutateAsync,
		isPending: emailPasswordLogin.isPending,
		isGooglePending: googleLogin.isPending,
	};
}
