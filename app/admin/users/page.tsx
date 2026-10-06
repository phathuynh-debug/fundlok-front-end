"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-authentication";
import { isAdminRole } from "@/services/authentication.service";
import { useTranslations } from "@/lib/i18n";
import { AdminDirectory, AdminPageLoader } from "../_components/AdminDirectory";
import { InviteAdminDialog } from "./_components/InviteAdminDialog";

export default function AdminUsersPage() {
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("admin.usersPage.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.usersPage.subtitle")}
          </p>
        </div>
        {/* Adding admins is SYSTEM_ADMIN only server-side; hidden for everyone
            else so a plain admin isn't offered a button that can only 403. */}
        {user.role === "SYSTEM_ADMIN" && <InviteAdminDialog />}
      </div>

      <AdminDirectory mode="users" />
    </div>
  );
}
