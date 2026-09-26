import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { AuthFormSwitcher } from "@/components/auth-form-switcher";
import { getServerTranslations } from "@/lib/i18n/server";

// `?mode=register` opens straight on the sign-up form. This is the only entry
// point to registration now that /register is gone: the footer link, the rate
// page's CTA and the 308 from the old route all land here, and a button that
// says "sign up" has to show the sign-up form rather than a login box.
type LoginSearchParams = Promise<{ mode?: string }>;

const isRegister = (mode: string | undefined) => mode === "register";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}): Promise<Metadata> {
  const { mode } = await searchParams;
  const { t } = await getServerTranslations();

  // The register view keeps the copy the old /register page was indexed under,
  // and canonicalises to itself so the 308 does not land on a URL that then
  // points somewhere else.
  return isRegister(mode)
    ? {
        alternates: { canonical: "/login?mode=register" },
        title: t("seo.registerTitle"),
        description: t("seo.registerDescription"),
      }
    : {
        alternates: { canonical: "/login" },
        title: t("seo.loginTitle"),
        description: t("seo.loginDescription"),
      };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const { mode } = await searchParams;

  return (
    <AuthLayout>
      <AuthFormSwitcher initialMode={isRegister(mode) ? "register" : "login"} />
    </AuthLayout>
  );
}
