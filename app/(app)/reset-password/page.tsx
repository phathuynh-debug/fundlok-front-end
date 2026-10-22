import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Loader2 } from "lucide-react";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.resetPasswordTitle"),
    description: t("seo.resetPasswordDescription"),
  };
}

export default async function ResetPasswordPage() {
  const { t } = await getServerTranslations();
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("auth.resetPassword.loadingForm")}
            </p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
