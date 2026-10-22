import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    alternates: { canonical: "/forgot-password" },
    title: t("seo.forgotPasswordTitle"),
    description: t("seo.forgotPasswordDescription"),
  };
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
