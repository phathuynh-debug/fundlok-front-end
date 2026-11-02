"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinishSepayConnect } from "@/hooks/use-sepay";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { useTranslations } from "@/lib/i18n";

const K = "dashboard.settings.profile.sepay";
const PROFILE = "/dashboard/settings/profile#sepay";

// Hands SePay's `code` and `state` to the backend, which checks the state and
// trades the code for tokens. The code works once and expires in 5 minutes,
// so it is sent as soon as the page loads, and only once.
export function SepayCallbackClient() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const finish = useFinishSepayConnect();
  const sent = useRef(false);

  const code = params.get("code");
  const state = params.get("state");
  // SePay redirects with ?error=access_denied when the user declines.
  const declined = params.get("error") !== null;
  const missing = !declined && (!code || !state);

  useEffect(() => {
    if (sent.current || declined || !code || !state) return;
    sent.current = true;
    finish.mutate(
      { code, state },
      {
        onSuccess: () => {
          toast({
            title: t(`${K}.connectedTitle`),
            description: t(`${K}.connectedDescription`),
          });
          router.replace(PROFILE);
        },
      },
    );
  }, [code, state, declined, finish, router, t, toast]);

  const failed = declined || missing || finish.isError;
  const message = declined
    ? t(`${K}.declined`)
    : finish.isError
      ? apiErrorMessage(finish.error, locale, t(`${K}.connectFailedBody`))
      : t(`${K}.connectFailedBody`);

  return (
    <div className="mx-auto max-w-lg py-12">
      <Card className="p-8 text-center">
        {failed ? (
          <div className="space-y-4">
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
            <h1 className="text-lg font-semibold text-foreground">
              {t(`${K}.connectFailed`)}
            </h1>
            <p role="alert" className="text-sm text-muted-foreground">
              {message}
            </p>
            <Button asChild className="rounded-full">
              <Link href={PROFILE}>{t(`${K}.backToProfile`)}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t(`${K}.finishing`)}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
