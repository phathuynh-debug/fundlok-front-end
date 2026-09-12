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
  Palette,
  type LucideIcon,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import Logo from "@/components/logo";
import { NotificationsPanel } from "@/components/notifications-panel";
import { CONTROL_ICON_IDLE, CONTROL_IDLE } from "@/lib/ui-tokens";

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Anchor for the first-run walkthrough — see lib/constants/tour-steps.ts. */
  tourId?: string;
}

const SETTINGS_HREF = "/dashboard/settings";

const navItems: NavItem[] = [
  {
    labelKey: "dashboard.sidebar.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    tourId: "nav-overview",
  },
  {
    labelKey: "dashboard.sidebar.investmentProjects",
    href: "/dashboard/projects",
    icon: Briefcase,
    tourId: "nav-projects",
  },
  {
    labelKey: "dashboard.sidebar.transactions",
    href: "/dashboard/transactions",
    icon: History,
    tourId: "nav-transactions",
  },
  {
    labelKey: "dashboard.sidebar.analytics",
    href: "/dashboard/analytics",
    icon: PieChart,
    tourId: "nav-analytics",
  },
  {
    labelKey: "dashboard.sidebar.security",
    href: "/dashboard/security",
    icon: ShieldCheck,
    tourId: "nav-security",
  },
];

// Only routes that exist. "Account" was removed rather than built: every
// account capability the API exposes already lives on the profile page
// (identity, email, role, password) or on /dashboard/security (sessions,
// alerts), so a third page would only re-render the other two. "Billing" was
// removed because the product has no per-user billing — FundLok's fee is
// deducted from each disbursement through the omnibus account, so a user never
// enters a payment method or receives an invoice.
//
// An Account page earns its place once the backend can change an email (with
// re-verification), unlink an OAuth provider, export data, or close an account
// — none of which have endpoints today, and account closure is a Decree 94
// retention question before it is a UI one.
const settingsItems: NavItem[] = [
  {
    labelKey: "dashboard.sidebar.settingsProfile",
    href: "/dashboard/settings/profile",
    icon: UserRound,
  },
  {
    labelKey: "dashboard.sidebar.settingsAppearance",
    href: "/dashboard/settings/appearance",
    icon: Palette,
  },
];

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  tourId,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  tourId?: string;
}) {
  return (
    <Link
      href={href}
      data-tour={tourId}
      className={cn(
        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
        active ? "bg-primary/10 text-primary" : CONTROL_IDLE,
      )}
    >
      <Icon
        className={cn(
          "mr-3 h-5 w-5 shrink-0",
          active ? "text-primary" : CONTROL_ICON_IDLE,
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
                  tourId={item.tourId}
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
                    : CONTROL_IDLE,
                )}
              >
                <Settings
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0",
                    pathname.startsWith(SETTINGS_HREF)
                      ? "text-primary"
                      : CONTROL_ICON_IDLE,
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
                className="group flex w-full items-center px-3 py-2 mb-1 text-sm font-semibold rounded-md text-foreground transition-all duration-200 hover:bg-muted"
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
                  tourId={item.tourId}
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
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.full_name || t("common.fundlokUser")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role
                  ? `${user.role} ${t("dashboard.sidebar.memberSuffix")}`
                  : t("dashboard.sidebar.verifiedMember")}
              </p>
            </div>

            {/* Notifications live on the user row, and open as a hover
                preview rather than a page: you check notifications, you do not
                configure them — and there is no notifications route. */}
            <NotificationsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
