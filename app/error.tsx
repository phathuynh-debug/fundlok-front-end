"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

// Route-level error boundary. It renders inside the root layout, so the
// LocaleProvider is available and the copy follows the chosen language rather
// than Next's built-in English fallback.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useTranslations();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <AlertTriangle
            className="h-8 w-8 text-muted-foreground"
            aria-hidden
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {t("errorPage.title")}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("errorPage.description")}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => retry()}>{t("errorPage.retry")}</Button>
          <Button asChild variant="outline">
            <Link href="/">{t("common.backToHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
