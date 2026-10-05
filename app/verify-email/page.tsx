import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { VerifyEmailClient } from "./verify-email-client";
import { Loader2 } from "lucide-react";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.verifyEmailTitle"),
    description: t("seo.verifyEmailDescription"),
  };
}

export default async function Page() {
  const { t } = await getServerTranslations();
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {t("auth.verifyEmail.loadingScreen")}
            </p>
          </div>
        }
      >
        <VerifyEmailClient />
      </Suspense>
    </AuthLayout>
  );
}
