"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { useRequireAuth } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import { isAdminRole } from "@/services/authentication.service";
import { AdminPageLoader } from "../_components/AdminDirectory";
import { ComposeEmailCard } from "./_components/ComposeEmailCard";
import { EmailPolicyCard } from "./_components/EmailPolicyCard";
import { EmailSettingsCard } from "./_components/EmailSettingsCard";
import { SentEmailsCard } from "./_components/SentEmailsCard";

// Admin > Email: every admin connects their own Gmail account, then composes
// and sends templated email from it. A system admin also sets the recipient
// domains every admin may send to. Admins only — the proxy turns everyone
// else away, this page redirects as a fallback, and the API answers 403.
export default function AdminEmailPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const { t } = useTranslations();

  useEffect(() => {
    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isAdminRole(user.role)) {
    return <AdminPageLoader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("admin.email.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.email.subtitle")}
          </p>
        </div>
      </div>

      <EmailSettingsCard />
      <ComposeEmailCard />
      <SentEmailsCard />
      {user.role === "SYSTEM_ADMIN" && <EmailPolicyCard />}
    </div>
  );
}
