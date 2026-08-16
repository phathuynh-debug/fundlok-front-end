import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { VerifyEmailClient } from "./verify-email-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address to access your FundLok dashboard.",
};

export default function Page() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading verification screen...
            </p>
          </div>
        }
      >
        <VerifyEmailClient />
      </Suspense>
    </AuthLayout>
  );
}
