"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-authentication";
import { isAdminRole } from "@/services/authentication.service";
import { useTranslations } from "@/lib/i18n";
import { AdminDirectory, AdminPageLoader } from "../_components/AdminDirectory";

export default function AdminProjectsPage() {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("admin.projectsPage.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.projectsPage.subtitle")}
        </p>
      </div>

      <AdminDirectory mode="projects" />
    </div>
  );
}
