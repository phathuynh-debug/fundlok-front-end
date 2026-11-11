import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { VerifyPhoneClient } from "./verify-phone-client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.verifyPhoneTitle"),
    description: t("seo.verifyPhoneDescription"),
  };
}

// Between /verify-email and /select-role: the proxy sends every new account
// here (password sign-up or Google) until it has proven a phone number.
export default function Page() {
  return (
    <AuthLayout>
      <VerifyPhoneClient />
    </AuthLayout>
  );
}
