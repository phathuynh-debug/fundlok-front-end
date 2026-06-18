import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your FundLok portal.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading reset form...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
