import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { AuthFormSwitcher } from "@/components/auth-form-switcher";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your FundLok portal to manage SME funding requests or your investment portfolio.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthFormSwitcher initialMode="login" />
    </AuthLayout>
  );
}
