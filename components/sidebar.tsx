"use client";

import { useState } from "react";
import Link from "next/link";
// Logo component used instead of Image for theme-aware images
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  History,
  Settings,
  ShieldCheck,
  PieChart,
  ChevronLeft,
  ChevronRight,
  UserRound,
  UserCog,
  Bell,
  Palette,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import Logo from "@/components/logo";

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

const SETTINGS_HREF = "/dashboard/settings";

const navItems: NavItem[] = [
  {
    labelKey: "dashboard.sidebar.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    labelKey: "dashboard.sidebar.investmentProjects",
    href: "/dashboard/projects",
    icon: Briefcase,
  },
  {
    labelKey: "dashboard.sidebar.transactions",
    href: "/dashboard/transactions",
    icon: History,
  },
  {
    labelKey: "dashboard.sidebar.analytics",
    href: "/dashboard/analytics",
    icon: PieChart,
  },
  {
    labelKey: "dashboard.sidebar.security",
    href: "/dashboard/security",
    icon: ShieldCheck,
  },
];

const settingsItems: NavItem[] = [
  {
    labelKey: "dashboard.sidebar.settingsProfile",
    href: "/dashboard/settings/profile",
    icon: UserRound,
  },
  {
    labelKey: "dashboard.sidebar.settingsAccount",
    href: "/dashboard/settings/account",
    icon: UserCog,
  },
  {
    labelKey: "dashboard.sidebar.settingsNotifications",
    href: "/dashboard/settings/notifications",
    icon: Bell,
  },
  {
    labelKey: "dashboard.sidebar.settingsAppearance",
    href: "/dashboard/settings/appearance",
    icon: Palette,
  },
  {
    labelKey: "dashboard.sidebar.settingsBilling",
    href: "/dashboard/settings/billing",
    icon: CreditCard,
  },
];

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon
        className={cn(
          "mr-3 h-5 w-5 shrink-0",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-accent-foreground",
        )}
      />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const { t } = useTranslations();

  const isSME = user?.role === "SME";

  const filteredNavItems = navItems.filter((item) => {
    if (isSME && item.href === "/dashboard/projects") {
      return false;
    }
    return true;
  });

  const [showSettings, setShowSettings] = useState(() =>
    pathname.startsWith(SETTINGS_HREF),
  );

  return (
    <div className="hidden border-r bg-card md:flex md:w-64 md:flex-col h-screen">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logo */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-2xl tracking-tight text-primary"
          >
            <Logo alt={t("common.brandName")} />
          </Link>
        </div>

        {/* Sliding nav: two panes on a track that translates between them */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <div
            className={cn(
              "flex h-full w-[200%] transition-transform duration-300 ease-in-out",
              showSettings ? "-translate-x-1/2" : "translate-x-0",
            )}
          >
            {/* Pane 1: main navigation */}
            <nav className="w-1/2 shrink-0 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  active={pathname === item.href}
                />
              ))}

              {/* Settings — slides to the sub-menu instead of navigating */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className={cn(
                  "group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  pathname.startsWith(SETTINGS_HREF)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Settings
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0",
                    pathname.startsWith(SETTINGS_HREF)
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-accent-foreground",
                  )}
                />
                {t("dashboard.sidebar.settings")}
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </nav>

            {/* Pane 2: settings sub-navigation */}
            <nav className="w-1/2 shrink-0 px-3 py-4 space-y-1 overflow-y-auto">
              {/* Back to main menu */}
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="group flex w-full items-center px-3 py-2 mb-1 text-sm font-semibold rounded-md text-foreground transition-all duration-200 hover:bg-accent"
              >
                <ChevronLeft className="mr-2 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                {t("dashboard.sidebar.settings")}
              </button>

              <div className="border-t border-border/60 my-1" />

              {settingsItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  active={pathname === item.href}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="flex shrink-0 border-t p-4">
          <div className="flex items-center gap-3 px-2 py-2 w-full">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage
                src={user?.avatar_url ?? undefined}
                alt={user?.full_name ?? ""}
              />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.full_name || t("common.fundlokUser")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role
                  ? `${user.role} ${t("dashboard.sidebar.memberSuffix")}`
                  : t("dashboard.sidebar.verifiedMember")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
