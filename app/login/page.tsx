import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { AuthFormSwitcher } from "@/components/auth-form-switcher";

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

  // The register view keeps the copy the old /register page was indexed under,
  // and canonicalises to itself so the 308 does not land on a URL that then
  // points somewhere else.
  return isRegister(mode)
    ? {
        alternates: { canonical: "/login?mode=register" },
        title: "Create an account — apply for funding or invest",
        description:
          "Create an account on FundLok to apply for SME funding or to invest in private credit opportunities.",
      }
    : {
        alternates: { canonical: "/login" },
        title: "Sign in to your SME or investor dashboard",
        description:
          "Sign in to your FundLok portal to manage SME funding requests or your investment portfolio.",
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
