import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  alternates: { canonical: "/forgot-password" },
  title: "Reset your password — account recovery",
  description:
    "Reset the password for your FundLok account. We email a secure link so you can sign back in to your SME or investor dashboard.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
