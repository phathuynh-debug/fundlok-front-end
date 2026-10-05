"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calculator,
  ScrollText,
  ServerCog,
  ShieldCheck,
  ScanFace,
  LogOut,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser, useLogout } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import Logo from "@/components/logo";
import { CONTROL_ICON_IDLE, CONTROL_IDLE } from "@/lib/ui-tokens";

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  // When true, only SYSTEM_ADMIN sees this entry.
  systemAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { labelKey: "admin.sidebar.overview", href: "/admin", icon: LayoutDashboard },
  { labelKey: "admin.sidebar.users", href: "/admin/users", icon: Users },
  {
    labelKey: "admin.sidebar.projects",
    href: "/admin/projects",
    icon: Briefcase,
  },
  {
    labelKey: "admin.sidebar.kycReviews",
    href: "/admin/kyc-reviews",
    icon: ScanFace,
  },
  {
    labelKey: "admin.sidebar.rates",
    href: "/admin/rates",
    icon: Calculator,
  },
  {
    labelKey: "admin.sidebar.auditLogs",
    href: "/admin/audit-logs",
    icon: ScrollText,
  },
  {
    labelKey: "admin.sidebar.systemSettings",
    href: "/admin/system",
    icon: ServerCog,
    systemAdminOnly: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: user } = useCurrentUser();
  const { t } = useTranslations();

  const isSystemAdmin = user?.role === "SYSTEM_ADMIN";
  const visibleNavItems = navItems.filter(
    (item) => !item.systemAdminOnly || isSystemAdmin,
  );

  return (
    <div className="hidden border-r bg-card md:flex md:w-64 md:flex-col h-screen">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
          <Link
            href="/admin"
            className="flex min-w-0 items-center font-bold tracking-tight text-primary"
          >
            <Logo
              alt="FundLok"
              containerClassName="relative w-28 h-8 overflow-hidden shrink-0"
            />
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("admin.sidebar.badge")}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  active ? "bg-primary/10 text-primary" : CONTROL_IDLE,
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0",
                    active ? "text-primary" : CONTROL_ICON_IDLE,
                  )}
                />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t p-3">
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className={cn(
              "group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none",
              CONTROL_IDLE,
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="mr-3 h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <LogOut
                className={cn("mr-3 h-5 w-5 shrink-0", CONTROL_ICON_IDLE)}
              />
            )}
            {t("admin.sidebar.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
