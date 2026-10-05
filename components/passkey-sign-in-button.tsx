"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePasskeyLogin } from "@/hooks/use-authentication";
import { landingRouteFor } from "@/app/login/use-login";
import { isPasskeyCancellation, isPasskeySupported } from "@/lib/passkeys";
import { useTranslations } from "@/lib/i18n";
import { apiErrorMessage } from "@/lib/api-error-message";

/**
 * "Sign in with a passkey" — no email, no password.
 *
 * Renders nothing at all on a browser that cannot do WebAuthn, rather than a
 * disabled button: an offer you cannot accept is worse than no offer.
 *
 * The support check goes through `useSyncExternalStore` rather than an effect.
 * `window.PublicKeyCredential` does not exist during the server render, so the
 * value legitimately differs between server and client — which is precisely
 * what the third argument (the server snapshot) is for. An effect would do the
 * same job while tripping `react-hooks/set-state-in-effect`, and a lazy
 * `useState` initialiser would produce a hydration mismatch.
 */
export function PasskeySignInButton() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const signIn = usePasskeyLogin();

  // Capability never changes within a page view, so the subscribe callback has
  // nothing to listen to and returns a no-op unsubscribe.
  const supported = useSyncExternalStore(
    useCallback(() => () => {}, []),
    isPasskeySupported,
    () => false,
  );

  if (!supported) return null;

  const handleClick = () => {
    signIn.mutate(undefined, {
      onSuccess: (user) => router.push(landingRouteFor(user)),
      onError: (error) => {
        // Dismissing the system sheet is the common case and is not a failure.
        if (isPasskeyCancellation(error)) return;
        toast({
          variant: "destructive",
          title: t("auth.login.passkeyFailedTitle"),
          description: apiErrorMessage(
            error,
            locale,
            t("auth.login.passkeyFailedBody"),
          ),
        });
      },
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={signIn.isPending}
      className="w-full gap-2"
    >
      {signIn.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4" />
      )}
      {t("auth.login.signInWithPasskey")}
    </Button>
  );
}
