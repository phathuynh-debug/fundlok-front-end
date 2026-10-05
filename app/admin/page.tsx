"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useAdminOverview } from "@/hooks/use-admin";
import { isAdminRole } from "@/services/authentication.service";
import { Loader2, Users, Briefcase, ShieldCheck } from "lucide-react";
import { AdminPageLoader } from "./_components/AdminDirectory";
import { RecentLeads } from "./_components/RecentLeads";
import { useTranslations } from "@/lib/i18n";
import { roleLabel } from "@/lib/enum-labels";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const { t, locale } = useTranslations();
  const isAdmin = !isLoading && isAdminRole(user?.role);

  // The overview is stats only — the users and projects tables have their own
  // sidebar routes. `page_size: 1` keeps the required table payload down to a
  // single row instead of pulling a page this screen never renders.
  const { data, isLoading: isOverviewLoading } = useAdminOverview(
    { mode: "users", page: 1, page_size: 1 },
    isAdmin,
  );

  // Fallback guard: middleware blocks non-admins server-side, but if the
  // session changes between the request and render, bounce them out.
  useEffect(() => {
    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isAdminRole(user.role)) {
    return <AdminPageLoader />;
  }

  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("admin.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.welcome", { name: user.full_name || user.email })}
        </p>
      </div>

      {/* Stat cards. The two counts link to the table they summarise. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/users"
          className={cn(
            "rounded-lg border bg-card p-5 transition-colors",
            CONTROL_HOVER,
          )}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("admin.stats.users")}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {isOverviewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              (stats?.total_users ?? "—")
            )}
          </p>
        </Link>

        <Link
          href="/admin/projects"
          className={cn(
            "rounded-lg border bg-card p-5 transition-colors",
            CONTROL_HOVER,
          )}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("admin.stats.projects")}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {isOverviewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              (stats?.total_projects ?? "—")
            )}
          </p>
        </Link>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">{t("admin.stats.role")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {roleLabel(t, user.role)}
          </p>
        </div>
      </div>

      {/* Who asked for a rate on the public /rate page, with how to reach
          them — the follow-up list, on the first screen an admin sees. */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("admin.recentLeads.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.recentLeads.subtitle")}
          </p>
        </div>
        <RecentLeads enabled={isAdmin} locale={locale} t={t} />
      </div>
    </div>
  );
}
